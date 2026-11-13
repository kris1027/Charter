import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
    PreviewClient,
    PreviewClientStatus,
    PreviewResult,
} from '@/features/pdf/live-preview/preview-client';
import { FIT_SEARCH_CAP_MS, usePreviewDocument } from '@/features/preview/use-preview-document';
import { EMPTY_RESUME } from '@/features/resume/stored-resume';
import type { TemplatePdfInput } from '@/features/templates/pdf/template-pdf';
import type { AppLang } from '@/lib/app-lang';

// Fake PDF bytes: the page count, then the scale in 64ths, so a test can tell whose they are
const pdfOf = (pages: number, scale = 0) => Uint8Array.of(pages, Math.round(scale * 64)).buffer;
const scaleOf = (pdf: ArrayBuffer) => new Uint8Array(pdf)[1] / 64;
type CountPages = (pdf: ArrayBuffer) => Promise<number | null>;
const countPages: CountPages = async (pdf) => new Uint8Array(pdf)[0];

// A client the test answers by hand; it also counts how many requests are open at once
const createFakeClient = () => {
    const requests: TemplatePdfInput[] = [];
    let onResult: (result: PreviewResult) => void = () => {};
    let onStatus: (status: PreviewClientStatus) => void = () => {};
    let open = 0;
    let mostOpen = 0;
    const client: PreviewClient = {
        request: (input) => {
            requests.push(input);
            open += 1;
            mostOpen = Math.max(mostOpen, open);
        },
        onResult: (callback) => {
            onResult = callback;
        },
        onStatus: (callback) => {
            onStatus = callback;
        },
        dispose: vi.fn(),
    };
    const respond = (result: PreviewResult) =>
        act(async () => {
            open = Math.max(0, open - 1);
            onResult(result);
        });
    return {
        client,
        requests,
        respond,
        // A late answer for a request the client already timed out
        respondLate: (result: PreviewResult) => act(async () => onResult(result)),
        emitStatus: (status: PreviewClientStatus) => act(async () => onStatus(status)),
        mostOpen: () => mostOpen,
        last: () => requests[requests.length - 1],
    };
};

type Fake = ReturnType<typeof createFakeClient>;

// Answers the newest request as a resume that is `fullPages` long and fits from `fitsFrom` up
const answer = (fake: Fake, fullPages: number, fitsFrom: number) => {
    const { compactScale } = fake.last();
    const pages = compactScale === 0 ? fullPages : compactScale >= fitsFrom ? 1 : 2;
    return fake.respond({ ok: true, pdf: pdfOf(pages, compactScale) });
};

// Answers until no new request follows an answer
const answerAll = async (fake: Fake, fullPages: number, fitsFrom: number) => {
    let answered = -1;
    while (fake.requests.length !== answered) {
        answered = fake.requests.length;
        await answer(fake, fullPages, fitsFrom);
    }
};

const setup = async ({
    strict = false,
    count = countPages,
}: { strict?: boolean; count?: CountPages } = {}) => {
    const fake = createFakeClient();
    const createClient = vi.fn(() => fake.client);
    const hook = renderHook(
        ({ lang }: { lang: AppLang }) =>
            usePreviewDocument({
                data: EMPTY_RESUME,
                templateId: 'developer',
                lang,
                createClient,
                countPages: count,
            }),
        { initialProps: { lang: 'en' }, reactStrictMode: strict },
    );
    // The run sends its first request after a tick
    await act(async () => {});
    return { fake, createClient, hook, current: () => hook.result.current };
};

describe('usePreviewDocument', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('should ask for the full size render and keep its bytes when the resume has one page', async () => {
        const { fake, current } = await setup();
        expect(fake.requests).toEqual([
            { data: EMPTY_RESUME, templateId: 'developer', compactScale: 0, lang: 'en' },
        ]);
        expect(current().shown).toBeNull();
        const pdf = pdfOf(1);

        await fake.respond({ ok: true, pdf });

        expect(current()).toMatchObject({ status: 'ready', fit: 'idle', mode: 'full', scale: 0 });
        expect(current().shown).toEqual({ pdf, pages: 1 });
        expect(current().shown?.pdf).toBe(pdf);
        expect(fake.requests).toHaveLength(1);
    });

    it('should move from starting to rendering when the worker reports ready', async () => {
        const { fake, current } = await setup();
        expect(current().status).toBe('starting');

        await fake.emitStatus('updating');

        expect(current().status).toBe('rendering');
    });

    it('should search for the one page scale and keep both versions when the resume fits', async () => {
        const { fake, current } = await setup();

        await answer(fake, 2, 0.3);
        expect(current()).toMatchObject({ status: 'ready', fit: 'checking' });
        expect(current().shown?.pages).toBe(2);
        await answerAll(fake, 2, 0.3);

        expect(current()).toMatchObject({ fit: 'fits', mode: 'full', scale: 0 });
        expect(fake.requests.map((request) => request.compactScale)).toEqual([
            0, 1, 0.5, 0.25, 0.375, 0.3125, 0.28125, 0.296875,
        ]);
        // Trials are never shown: full size stays on screen
        expect(current().shown?.pages).toBe(2);
    });

    it('should show the kept one page bytes without a new request when the mode changes', async () => {
        const { fake, current } = await setup();
        await answerAll(fake, 2, 0.3);
        const full = current().shown;

        act(() => current().setMode('onePage'));

        expect(current()).toMatchObject({ mode: 'onePage', scale: 0.3125 });
        expect(current().shown?.pages).toBe(1);
        expect(scaleOf(current().shown!.pdf)).toBe(0.3125);
        expect(fake.requests).toHaveLength(8);

        act(() => current().setMode('full'));

        expect(current().shown).toBe(full);
        expect(fake.requests).toHaveLength(8);
    });

    it('should stay on full size when one page is asked for but no version fits', async () => {
        const { fake, current } = await setup();
        await fake.respond({ ok: true, pdf: pdfOf(1) });

        act(() => current().setMode('onePage'));

        expect(current().mode).toBe('full');
    });

    it('should report too long when scale 1 is still over one page', async () => {
        const { fake, current } = await setup();

        await answerAll(fake, 3, 2);

        expect(current()).toMatchObject({ status: 'ready', fit: 'too-long', scale: 0 });
        expect(fake.requests.map((request) => request.compactScale)).toEqual([0, 1]);
        expect(current().shown?.pages).toBe(3);
    });

    it('should ignore the old run and start over in the new language when it changes mid search', async () => {
        const { fake, hook, current } = await setup();
        await answer(fake, 2, 0.3);
        await answer(fake, 2, 0.3);
        expect(fake.last()).toMatchObject({ compactScale: 0.5, lang: 'en' });

        hook.rerender({ lang: 'pl' });
        await act(async () => {});

        // The new run waits for the trial in flight; the kept bytes are gone at once
        expect(fake.requests).toHaveLength(3);
        expect(current()).toMatchObject({ fit: 'idle', mode: 'full' });
        expect(current().shown).toBeNull();

        await answer(fake, 2, 0.3);

        // The old trial's answer started no further English trial
        expect(fake.requests).toHaveLength(4);
        expect(fake.last()).toMatchObject({ compactScale: 0, lang: 'pl' });
        expect(current().shown).toBeNull();

        await answerAll(fake, 2, 0.3);

        expect(current()).toMatchObject({ status: 'ready', fit: 'fits', mode: 'full' });
        expect(fake.requests.slice(3).every((request) => request.lang === 'pl')).toBe(true);
        expect(fake.requests).toHaveLength(3 + 8);
    });

    it('should reset to full size when the language changes after one page was chosen', async () => {
        const { fake, hook, current } = await setup();
        await answerAll(fake, 2, 0.3);
        act(() => current().setMode('onePage'));

        hook.rerender({ lang: 'pl' });
        await act(async () => {});

        expect(current()).toMatchObject({ mode: 'full', fit: 'idle', scale: 0 });
        expect(current().shown).toBeNull();

        await answerAll(fake, 2, 0.3);

        expect(current()).toMatchObject({ mode: 'full', fit: 'fits' });
        expect(current().shown?.pages).toBe(2);
    });

    it('should never have two requests open at once', async () => {
        const { fake, hook, current } = await setup();
        await answer(fake, 2, 0.3);
        await answer(fake, 2, 0.3);
        hook.rerender({ lang: 'pl' });
        await act(async () => {});
        hook.rerender({ lang: 'en' });
        await act(async () => {});
        await answerAll(fake, 2, 0.3);
        act(() => current().retry());
        await act(async () => {});
        await answerAll(fake, 2, 0.3);

        expect(current().fit).toBe('fits');
        expect(fake.mostOpen()).toBe(1);
    });

    it('should latch unavailable when the worker cannot start, even if a late ready follows', async () => {
        const { fake, current } = await setup();

        await fake.emitStatus('unavailable');

        expect(current()).toMatchObject({ status: 'unavailable', fit: 'idle', scale: 0 });
        expect(current().shown).toBeNull();

        await fake.emitStatus('ready');
        await fake.respondLate({ ok: true, pdf: pdfOf(1) });

        expect(current().status).toBe('unavailable');
        expect(current().shown).toBeNull();
    });

    it('should keep the drawn pages and fail the search when the worker crashes mid search', async () => {
        const { fake, current } = await setup();
        await answer(fake, 2, 0.3);
        const full = current().shown;
        expect(current().fit).toBe('checking');

        await fake.emitStatus('unavailable');

        expect(current()).toMatchObject({ status: 'unavailable', fit: 'failed', mode: 'full' });
        expect(current().shown).toBe(full);

        await fake.emitStatus('ready');
        await fake.respondLate({ ok: true, pdf: pdfOf(1, 1) });

        expect(current()).toMatchObject({ status: 'unavailable', fit: 'failed' });
        expect(current().shown).toBe(full);
        expect(fake.requests).toHaveLength(2);
    });

    it('should drop a late result when nothing is waiting for it', async () => {
        const { fake, current } = await setup();
        await fake.respond({ ok: false });
        expect(current().status).toBe('failed');

        await fake.respondLate({ ok: true, pdf: pdfOf(1) });

        expect(current().status).toBe('failed');
        expect(current().shown).toBeNull();
    });

    it('should fail when the full size render fails, then draw when Try again succeeds', async () => {
        const { fake, current } = await setup();
        await fake.respond({ ok: false });
        expect(current()).toMatchObject({ status: 'failed', fit: 'idle' });

        act(() => current().retry());
        await act(async () => {});

        expect(fake.requests).toHaveLength(2);
        expect(fake.last().compactScale).toBe(0);

        await answerAll(fake, 2, 0.3);

        expect(current()).toMatchObject({ status: 'ready', fit: 'fits' });
        expect(current().shown?.pages).toBe(2);
    });

    it('should fail when the full size bytes cannot be counted', async () => {
        const { fake, current } = await setup({ count: async () => null });

        await fake.respond({ ok: true, pdf: pdfOf(1) });

        expect(current().status).toBe('failed');
        expect(current().shown).toBeNull();
    });

    it('should keep the full size pages and fail the search when a trial render fails', async () => {
        const { fake, current } = await setup();
        await answer(fake, 2, 0.3);
        await answer(fake, 2, 0.3);

        await fake.respond({ ok: false });

        expect(current()).toMatchObject({ status: 'ready', fit: 'failed' });
        expect(current().shown?.pages).toBe(2);
        expect(fake.requests).toHaveLength(3);
    });

    it.each([
        ['errors', async () => Promise.reject(new Error('broken'))],
        ['comes back null', async () => null],
        ['comes back 0', async () => 0],
    ])(
        'should fail the search, not count it as fitting, when a trial page count %s',
        async (_, brokenCount) => {
            const count = (pdf: ArrayBuffer) =>
                scaleOf(pdf) === 0.5 ? brokenCount() : countPages(pdf);
            const { fake, current } = await setup({ count });

            await answerAll(fake, 2, 0.3);

            expect(current()).toMatchObject({ status: 'ready', fit: 'failed' });
            expect(fake.last().compactScale).toBe(0.5);
        },
    );

    it('should end the search as failed after 60 seconds and drop the late result', async () => {
        vi.useFakeTimers();
        const { fake, current } = await setup();
        await answer(fake, 2, 0.3);
        await answer(fake, 2, 0.3);

        await act(async () => vi.advanceTimersByTime(FIT_SEARCH_CAP_MS - 1));
        expect(current().fit).toBe('checking');
        await act(async () => vi.advanceTimersByTime(1));

        expect(current()).toMatchObject({ status: 'ready', fit: 'failed' });

        await answer(fake, 2, 0.3);

        expect(current().fit).toBe('failed');
        expect(fake.requests).toHaveLength(3);
        act(() => current().setMode('onePage'));
        expect(current().mode).toBe('full');
    });

    it('should create one client and dispose it on unmount when run under StrictMode', async () => {
        vi.useFakeTimers();
        const { fake, createClient, hook } = await setup({ strict: true });

        act(() => vi.advanceTimersByTime(10));
        expect(createClient).toHaveBeenCalledTimes(1);
        expect(fake.requests).toHaveLength(1);
        expect(fake.client.dispose).not.toHaveBeenCalled();

        hook.unmount();
        act(() => vi.advanceTimersByTime(10));

        expect(fake.client.dispose).toHaveBeenCalledTimes(1);
    });
});
