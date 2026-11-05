import { pdf } from '@react-pdf/renderer';
import { TemplatePDF } from '@/features/templates/pdf/template-pdf';
import { createLatestOnlyRunner } from '@/features/pdf/live-preview/latest-only-runner';
import type { PreviewRequest, PreviewResponse } from '@/features/pdf/live-preview/preview-protocol';

// The live preview worker (spec 0009): react-pdf runs here, never on the builder's main thread.
// One render runs at a time: after a render timeout the client sends the next one while the
// old one may still run, so that one waits (only the newest) instead of running alongside.

const post = (message: PreviewResponse, transfer: Transferable[] = []) =>
    self.postMessage(message, { transfer });

const render = async ({ seq, input }: PreviewRequest) => {
    try {
        const blob = await pdf(<TemplatePDF {...input} />).toBlob();
        const bytes = await blob.arrayBuffer();
        post({ type: 'rendered', seq, pdf: bytes }, [bytes]);
    } catch {
        post({ type: 'failed', seq });
    }
};

const submit = createLatestOnlyRunner(render);

self.addEventListener('message', (event: MessageEvent<PreviewRequest>) => {
    if (event.data.type === 'render') submit(event.data);
});

post({ type: 'ready' });
