import type { TemplatePdfInput } from '@/features/templates/pdf/template-pdf';
import type { PreviewRequest, PreviewResponse } from '@/features/pdf/live-preview/preview-protocol';

export const WORKER_READY_TIMEOUT_MS = 20_000;
export const RENDER_TIMEOUT_MS = 30_000;

// updating: a render is in flight and the last pages stay on screen
export type PreviewClientStatus = 'starting' | 'ready' | 'updating' | 'unavailable';
export type PreviewResult = { ok: true; pdf: ArrayBuffer } | { ok: false };

// The slice of Worker the client uses, so tests can pass a fake
export type PreviewWorker = Pick<
    Worker,
    'postMessage' | 'terminate' | 'addEventListener' | 'removeEventListener'
>;

export type PreviewClient = {
    request: (input: TemplatePdfInput) => void;
    onResult: (callback: (result: PreviewResult) => void) => void;
    onStatus: (callback: (status: PreviewClientStatus) => void) => void;
    dispose: () => void;
};

export const createPreviewWorker = (): PreviewWorker =>
    new Worker(new URL('./preview-worker.tsx', import.meta.url), { type: 'module' });

// One worker, one render at a time, and one waiting slot that only ever holds the newest input
export const createPreviewClient = (
    createWorker: () => PreviewWorker = createPreviewWorker,
): PreviewClient => {
    let status: PreviewClientStatus = 'starting';
    let isReady = false;
    let crashed = false;
    let disposed = false;
    let seq = 0;
    let inFlightSeq: number | null = null;
    let pending: TemplatePdfInput | null = null;
    let renderTimer: ReturnType<typeof setTimeout> | undefined;
    let resultCallback: (result: PreviewResult) => void = () => {};
    let statusCallback: (status: PreviewClientStatus) => void = () => {};

    const setStatus = (next: PreviewClientStatus) => {
        if (status === next) return;
        status = next;
        statusCallback(next);
    };

    const sendPending = () => {
        if (!pending || inFlightSeq !== null || !isReady || crashed || disposed) return;
        seq += 1;
        inFlightSeq = seq;
        const message: PreviewRequest = { type: 'render', seq, input: pending };
        pending = null;
        worker.postMessage(message);
        setStatus('updating');
        renderTimer = setTimeout(() => finishRender({ ok: false }), RENDER_TIMEOUT_MS);
    };

    const finishRender = (result: PreviewResult) => {
        clearTimeout(renderTimer);
        inFlightSeq = null;
        resultCallback(result);
        setStatus('ready');
        sendPending();
    };

    const markUnavailable = () => {
        clearTimeout(readyTimer);
        setStatus('unavailable');
    };

    const handleMessage = (event: MessageEvent<PreviewResponse>) => {
        if (disposed || crashed) return;
        const message = event.data;
        if (message.type === 'ready') {
            clearTimeout(readyTimer);
            isReady = true;
            setStatus('ready');
            sendPending();
            return;
        }
        // Only the newest request sent counts; an older answer (after a timeout) is dropped
        if (message.seq !== seq) return;
        if (message.type === 'rendered') finishRender({ ok: true, pdf: message.pdf });
        else finishRender({ ok: false });
    };

    // Before ready this is a start failure a late ready can still undo; after ready it is final
    const handleError = () => {
        if (disposed) return;
        if (isReady) {
            crashed = true;
            clearTimeout(renderTimer);
            pending = null;
            worker.terminate();
        }
        markUnavailable();
    };

    const worker = createWorker();
    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.addEventListener('messageerror', handleError);
    const readyTimer = setTimeout(markUnavailable, WORKER_READY_TIMEOUT_MS);

    return {
        request: (input) => {
            if (disposed || crashed) return;
            pending = input;
            sendPending();
        },
        onResult: (callback) => {
            resultCallback = callback;
        },
        onStatus: (callback) => {
            statusCallback = callback;
        },
        dispose: () => {
            if (disposed) return;
            disposed = true;
            clearTimeout(readyTimer);
            clearTimeout(renderTimer);
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            worker.removeEventListener('messageerror', handleError);
            worker.terminate();
        },
    };
};
