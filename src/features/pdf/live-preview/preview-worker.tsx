import { pdf } from '@react-pdf/renderer';
import { TemplatePDF } from '@/features/templates/pdf/template-pdf';
import type { PreviewRequest, PreviewResponse } from '@/features/pdf/live-preview/preview-protocol';

// The live preview worker (spec 0009): react-pdf runs here, never on the builder's main thread.
// The client sends one render at a time, so this handles them one by one.

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

self.addEventListener('message', (event: MessageEvent<PreviewRequest>) => {
    if (event.data.type === 'render') void render(event.data);
});

post({ type: 'ready' });
