import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createPreviewClient,
    RENDER_TIMEOUT_MS,
    WORKER_READY_TIMEOUT_MS,
    type PreviewClientStatus,
    type PreviewResult,
    type PreviewWorker,
} from '@/features/pdf/live-preview/preview-client';
import type { PreviewRequest, PreviewResponse } from '@/features/pdf/live-preview/preview-protocol';
import type { TemplatePdfInput } from '@/features/templates/pdf/template-pdf';
import { EMPTY_RESUME } from '@/features/resume/stored-resume';

// A stand in for the worker: records what is posted and lets the test answer
class FakeWorker extends EventTarget implements PreviewWorker {
    sent: PreviewRequest[] = [];
    terminated = false;
    postMessage(message: PreviewRequest) {
        this.sent.push(message);
    }
    terminate() {
        this.terminated = true;
    }
    reply(message: PreviewResponse) {
        this.dispatchEvent(new MessageEvent('message', { data: message }));
    }
    fail(type: 'error' | 'messageerror' = 'error') {
        this.dispatchEvent(new Event(type));
    }
}

const input = (firstName: string): TemplatePdfInput => ({
    data: { ...EMPTY_RESUME, personalInfo: { ...EMPTY_RESUME.personalInfo, firstName } },
    templateId: 'developer',
    compactScale: 0,
    lang: 'en',
});

const nameOf = (request: PreviewRequest) => request.input.data.personalInfo.firstName;

const setup = () => {
    const worker = new FakeWorker();
    const client = createPreviewClient(() => worker);
    const statuses: PreviewClientStatus[] = [];
    const results: PreviewResult[] = [];
    client.onStatus((status) => statuses.push(status));
    client.onResult((result) => results.push(result));
    return { worker, client, statuses, results };
};

const pdfBytes = () => new ArrayBuffer(8);

describe('createPreviewClient', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should hold a request until the worker is ready when asked before ready', () => {
        const { worker, client, statuses } = setup();

        client.request(input('A'));
        expect(worker.sent).toHaveLength(0);

        worker.reply({ type: 'ready' });

        expect(worker.sent.map(nameOf)).toEqual(['A']);
        expect(statuses).toEqual(['ready', 'updating']);
    });

    it('should send only the newest request next when three arrive while busy', () => {
        const { worker, client, results } = setup();
        worker.reply({ type: 'ready' });
        client.request(input('A'));

        client.request(input('B'));
        client.request(input('C'));
        client.request(input('D'));
        expect(worker.sent).toHaveLength(1);

        worker.reply({ type: 'rendered', seq: worker.sent[0].seq, pdf: pdfBytes() });

        expect(worker.sent.map(nameOf)).toEqual(['A', 'D']);
        expect(results).toEqual([{ ok: true, pdf: expect.any(ArrayBuffer) }]);
    });

    it('should drop a late result when its seq is older than the newest sent', () => {
        const { worker, client, results } = setup();
        worker.reply({ type: 'ready' });
        client.request(input('A'));
        const firstSeq = worker.sent[0].seq;
        vi.advanceTimersByTime(RENDER_TIMEOUT_MS);
        client.request(input('B'));

        worker.reply({ type: 'rendered', seq: firstSeq, pdf: pdfBytes() });

        // Only the timeout's failure counts; the stale bytes never reach the panel
        expect(results).toEqual([{ ok: false }]);
    });

    it('should report failed and send the pending request when a render times out', () => {
        const { worker, client, results, statuses } = setup();
        worker.reply({ type: 'ready' });
        client.request(input('A'));
        client.request(input('B'));

        vi.advanceTimersByTime(RENDER_TIMEOUT_MS);

        expect(results).toEqual([{ ok: false }]);
        expect(worker.sent.map(nameOf)).toEqual(['A', 'B']);
        expect(statuses.at(-1)).toBe('updating');
    });

    it('should report failed when the worker answers failed', () => {
        const { worker, client, results, statuses } = setup();
        worker.reply({ type: 'ready' });
        client.request(input('A'));

        worker.reply({ type: 'failed', seq: worker.sent[0].seq });

        expect(results).toEqual([{ ok: false }]);
        expect(statuses.at(-1)).toBe('ready');
    });

    it('should report unavailable when the worker errors before ready', () => {
        const { worker, statuses } = setup();

        worker.fail();

        expect(statuses).toEqual(['unavailable']);
    });

    it('should report unavailable when the worker stays silent for 20 seconds', () => {
        const { statuses } = setup();

        vi.advanceTimersByTime(WORKER_READY_TIMEOUT_MS - 1);
        expect(statuses).toEqual([]);
        vi.advanceTimersByTime(1);

        expect(statuses).toEqual(['unavailable']);
    });

    it('should recover and render the waiting request when ready arrives after 20 seconds', () => {
        const { worker, client, statuses } = setup();
        client.request(input('A'));
        vi.advanceTimersByTime(WORKER_READY_TIMEOUT_MS);

        worker.reply({ type: 'ready' });

        expect(statuses).toEqual(['unavailable', 'ready', 'updating']);
        expect(worker.sent.map(nameOf)).toEqual(['A']);
    });

    it.each(['error', 'messageerror'] as const)(
        'should stay unavailable and send nothing more when the worker reports %s after ready',
        (type) => {
            const { worker, client, statuses } = setup();
            worker.reply({ type: 'ready' });
            client.request(input('A'));

            worker.fail(type);
            client.request(input('B'));
            worker.reply({ type: 'ready' });

            expect(statuses.at(-1)).toBe('unavailable');
            expect(worker.sent.map(nameOf)).toEqual(['A']);
            expect(worker.terminated).toBe(true);
        },
    );

    it('should terminate the worker and clear its timers when disposed', () => {
        const { worker, client, statuses } = setup();

        client.dispose();
        vi.advanceTimersByTime(WORKER_READY_TIMEOUT_MS);

        expect(worker.terminated).toBe(true);
        expect(statuses).toEqual([]);
    });
});
