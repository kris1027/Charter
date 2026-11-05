import type { PDFDocumentProxy } from 'pdfjs-dist';
import { getPdfjs } from '@/features/pdf/pdfjs-singleton';

// pdf.js transfers the bytes it gets to its own worker, emptying them, so it gets a copy: the
// caller keeps the PDF and can load it again (a reopened panel or sheet draws the kept bytes).
// disableFontFace draws glyphs as paths: adding and removing a PDF's fonts in document.fonts
// would lay out the whole builder page again on every update (spec 0009, AC-5)
export const loadPdf = async (pdf: ArrayBuffer): Promise<PDFDocumentProxy> => {
    const { getDocument } = await getPdfjs();
    return getDocument({ data: new Uint8Array(pdf.slice(0)), disableFontFace: true }).promise;
};

// Frees the document on both threads; pdf.js destroys a document through its loading task
export const destroyPdf = (doc: PDFDocumentProxy) => {
    void doc.loadingTask.destroy();
};

// Draws every page onto its own canvas, cssWidth wide on screen and cssWidth × dpr in pixels.
// A RenderingCancelledException passes through unchanged, so callers can tell it from a failure.
export const drawPdfPages = async (
    doc: PDFDocumentProxy,
    cssWidth: number,
    dpr: number,
): Promise<HTMLCanvasElement[]> => {
    const canvases: HTMLCanvasElement[] = [];
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
        const page = await doc.getPage(pageNumber);
        try {
            const base = page.getViewport({ scale: 1 });
            const scale = cssWidth / base.width;
            const viewport = page.getViewport({ scale: scale * dpr });
            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = `${cssWidth}px`;
            canvas.style.height = `${Math.floor(base.height * scale)}px`;
            await page.render({ canvas, viewport }).promise;
            canvases.push(canvas);
        } finally {
            page.cleanup();
        }
    }
    return canvases;
};
