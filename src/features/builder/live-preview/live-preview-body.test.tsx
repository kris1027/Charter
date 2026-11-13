import type { PDFDocumentProxy } from 'pdfjs-dist';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LivePreviewBody } from '@/features/builder/live-preview/live-preview-body';
import type { LivePreview } from '@/features/builder/live-preview/use-live-preview';
import { drawPdfPages, loadPdf } from '@/features/pdf/live-preview/draw-pdf-pages';
import { render, screen } from '@/test/test-utils';

vi.mock('@/features/pdf/live-preview/draw-pdf-pages', () => ({
    loadPdf: vi.fn(),
    drawPdfPages: vi.fn(),
    destroyPdf: vi.fn(),
}));

const canvases = (count: number) =>
    Array.from({ length: count }, () => document.createElement('canvas'));

const preview = (overrides: Partial<LivePreview> = {}): LivePreview => ({
    status: 'ready',
    pdf: new ArrayBuffer(1),
    failed: false,
    ...overrides,
});

// Spec 0013, AC-28: the count line and the hint moved here from PreviewPages, the look stays
describe('LivePreviewBody', () => {
    beforeEach(() => {
        vi.mocked(loadPdf).mockResolvedValue({} as PDFDocumentProxy);
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    });

    it('should show the count and the full size hint when the PDF has several pages', async () => {
        vi.mocked(drawPdfPages).mockResolvedValue(canvases(3));

        render(<LivePreviewBody preview={preview()} unavailableAction={null} />);

        expect(await screen.findByText('3 pages')).toBeInTheDocument();
        expect(screen.getByText('Full size, Preview can fit it to one page')).toBeInTheDocument();
    });

    it('should show no full size hint when the PDF has one page', async () => {
        vi.mocked(drawPdfPages).mockResolvedValue(canvases(1));

        render(<LivePreviewBody preview={preview()} unavailableAction={null} />);

        expect(await screen.findByText('1 page')).toBeInTheDocument();
        expect(screen.queryByText(/Full size/)).not.toBeInTheDocument();
    });

    it('should show the placeholder and no count when nothing is drawn yet', () => {
        render(<LivePreviewBody preview={preview({ pdf: null })} unavailableAction={null} />);

        expect(screen.getByText('Preparing preview…')).toBeInTheDocument();
        expect(screen.queryByText(/page/)).not.toBeInTheDocument();
    });

    it('should show the notice when the render failed in the worker', () => {
        render(
            <LivePreviewBody
                preview={preview({ pdf: null, failed: true })}
                unavailableAction={null}
            />,
        );

        expect(screen.getByText('Preview could not update')).toHaveAttribute('role', 'status');
    });
});
