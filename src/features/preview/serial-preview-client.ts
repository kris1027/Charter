import type { PreviewClient, PreviewResult } from '@/features/pdf/live-preview/preview-client';
import type { TemplatePdfInput } from '@/features/templates/pdf/template-pdf';

const FAILED: PreviewResult = { ok: false };

type SerialPreviewClientOptions = {
    createClient: () => PreviewClient;
    // The worker answered for the first time, or again later
    onReady: () => void;
    onUnavailable: () => void;
};

export type SerialPreviewClient = {
    // One answer per request; a failed result at once when unavailable or disposed
    render: (input: TemplatePdfInput) => Promise<PreviewResult>;
    // The request still in flight, if any, so a caller can wait for the line to clear
    inFlight: () => Promise<PreviewResult> | null;
    isReady: () => boolean;
    dispose: () => void;
};

// Turns the preview client's callbacks into one promise per request (spec 0013). The client has
// one waiting slot and one result callback with no request id, so two requests in flight could
// swap their answers: callers send the next request only after the last one answered. The
// worker starts with the first request. Unavailable is latched until reload, even if a late
// ready follows (AC-22).
export const createSerialPreviewClient = ({
    createClient,
    onReady,
    onUnavailable,
}: SerialPreviewClientOptions): SerialPreviewClient => {
    let client: PreviewClient | null = null;
    let waiter: ((result: PreviewResult) => void) | null = null;
    let inFlight: Promise<PreviewResult> | null = null;
    let isReady = false;
    let isUnavailable = false;
    let isDisposed = false;

    // A result with nothing waiting (a late answer after a timeout) is dropped here
    const settle = (result: PreviewResult) => {
        const resolve = waiter;
        waiter = null;
        inFlight = null;
        resolve?.(result);
    };

    const getClient = () => {
        if (client) return client;
        client = createClient();
        client.onResult(settle);
        client.onStatus((status) => {
            if (status === 'unavailable') {
                isUnavailable = true;
                onUnavailable();
                settle(FAILED);
                return;
            }
            if (status === 'starting') return;
            isReady = true;
            onReady();
        });
        return client;
    };

    return {
        render: (input) => {
            if (isUnavailable || isDisposed) return Promise.resolve(FAILED);
            const result = new Promise<PreviewResult>((resolve) => {
                waiter = resolve;
            });
            inFlight = result;
            getClient().request(input);
            return result;
        },
        inFlight: () => inFlight,
        isReady: () => isReady,
        dispose: () => {
            isDisposed = true;
            settle(FAILED);
            client?.dispose();
            client = null;
        },
    };
};
