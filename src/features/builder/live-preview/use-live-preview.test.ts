import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PreviewClient } from '@/features/pdf/live-preview/preview-client';
import type { TemplatePdfInput } from '@/features/templates/pdf/template-pdf';
import type { ResumeFormValues } from '@/features/resume/form-types';
import { EMPTY_RESUME } from '@/features/resume/stored-resume';
import {
    LIVE_PREVIEW_DEBOUNCE_MS,
    useLivePreview,
    type PreviewFormStore,
} from '@/features/builder/live-preview/use-live-preview';
import type { AppLang } from '@/lib/app-lang';

// A form store with only what the hook reads: state and subscribe
const createStore = () => {
    const listeners = new Set<() => void>();
    const form: PreviewFormStore & { setValues: (values: ResumeFormValues) => void } = {
        store: {
            state: { values: { ...EMPTY_RESUME } },
            subscribe: (listener) => {
                listeners.add(listener);
                return { unsubscribe: () => listeners.delete(listener) };
            },
        },
        setValues: (values) => {
            form.store.state = { ...form.store.state, values };
            listeners.forEach((listener) => listener());
        },
    };
    // A blur or validation update: the store notifies, the values object stays the same
    const touch = () => {
        form.store.state = { ...form.store.state };
        listeners.forEach((listener) => listener());
    };
    return { form, touch };
};

const createFakeClient = () => {
    const requests: TemplatePdfInput[] = [];
    const client: PreviewClient = {
        request: (input) => requests.push(input),
        onResult: () => {},
        onStatus: () => {},
        dispose: vi.fn(),
    };
    return { client, requests };
};

const withName = (firstName: string): ResumeFormValues => ({
    ...EMPTY_RESUME,
    personalInfo: { ...EMPTY_RESUME.personalInfo, firstName },
});

type HookProps = { active: boolean; lang: AppLang };

const setup = (initial: HookProps = { active: true, lang: 'en' }, strict = false) => {
    const { form, touch } = createStore();
    const { client, requests } = createFakeClient();
    const createClient = vi.fn(() => client);
    const hook = renderHook(
        ({ active, lang }: HookProps) =>
            useLivePreview({ form, templateId: 'developer', lang, active, createClient }),
        { initialProps: initial, reactStrictMode: strict },
    );
    return { form, touch, requests, createClient, client, hook };
};

describe('useLivePreview', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should request at once when it becomes active', () => {
        const { requests } = setup();

        expect(requests).toHaveLength(1);
        expect(requests[0]).toMatchObject({ templateId: 'developer', compactScale: 0, lang: 'en' });
    });

    it('should request once 700ms after the last of several edits', () => {
        const { form, requests } = setup();

        act(() => form.setValues(withName('A')));
        act(() => vi.advanceTimersByTime(400));
        act(() => form.setValues(withName('Ad')));
        act(() => vi.advanceTimersByTime(LIVE_PREVIEW_DEBOUNCE_MS - 1));
        expect(requests).toHaveLength(1);

        act(() => vi.advanceTimersByTime(1));

        expect(requests).toHaveLength(2);
        expect(requests[1].data.personalInfo.firstName).toBe('Ad');
    });

    it('should pass invalid values as typed when the form fails validation', () => {
        const { form, requests } = setup();
        const invalid = {
            ...withName('A'),
            personalInfo: { ...withName('A').personalInfo, email: 'not an email' },
        };

        act(() => form.setValues(invalid));
        act(() => vi.advanceTimersByTime(LIVE_PREVIEW_DEBOUNCE_MS));

        expect(requests[1].data.personalInfo.email).toBe('not an email');
    });

    it('should start no wait when a store update leaves the values unchanged', () => {
        const { touch, requests } = setup();

        act(() => touch());
        act(() => vi.advanceTimersByTime(LIVE_PREVIEW_DEBOUNCE_MS * 2));

        expect(requests).toHaveLength(1);
    });

    it('should request 700ms after the language changes', () => {
        const { hook, requests } = setup();

        hook.rerender({ active: true, lang: 'pl' });
        expect(requests).toHaveLength(1);
        act(() => vi.advanceTimersByTime(LIVE_PREVIEW_DEBOUNCE_MS));

        expect(requests).toHaveLength(2);
        expect(requests[1].lang).toBe('pl');
    });

    it('should create no client and request nothing when it is not active', () => {
        const { form, createClient, requests } = setup({ active: false, lang: 'en' });

        act(() => form.setValues(withName('A')));
        act(() => vi.advanceTimersByTime(LIVE_PREVIEW_DEBOUNCE_MS));

        expect(createClient).not.toHaveBeenCalled();
        expect(requests).toHaveLength(0);
    });

    it('should stop requesting but keep the client when it becomes inactive', () => {
        const { form, hook, client, requests } = setup();

        hook.rerender({ active: false, lang: 'en' });
        act(() => form.setValues(withName('A')));
        act(() => vi.advanceTimersByTime(LIVE_PREVIEW_DEBOUNCE_MS));

        expect(requests).toHaveLength(1);
        expect(client.dispose).not.toHaveBeenCalled();
    });

    it('should create one client and dispose it on unmount when run under StrictMode', () => {
        const { createClient, client, hook } = setup({ active: true, lang: 'en' }, true);

        act(() => vi.advanceTimersByTime(10));
        expect(createClient).toHaveBeenCalledTimes(1);
        expect(client.dispose).not.toHaveBeenCalled();

        hook.unmount();
        act(() => vi.advanceTimersByTime(10));

        expect(client.dispose).toHaveBeenCalledTimes(1);
    });
});
