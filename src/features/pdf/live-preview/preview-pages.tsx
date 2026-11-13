import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useTranslation } from 'react-i18next';
import { destroyPdf, drawPdfPages, loadPdf } from '@/features/pdf/live-preview/draw-pdf-pages';
import {
    PAGE_MAX_WIDTH_CLASS,
    PAGE_SHEET_CLASS,
    WARNING_NOTICE_CLASS,
} from '@/features/pdf/live-preview/preview-styles';

export const MAX_PAGE_CSS_WIDTH = 900;
const RESIZE_DEBOUNCE_MS = 150;
const RESIZE_MIN_CHANGE_PX = 8;

type PreviewPagesProps = {
    pdf: ArrayBuffer | null;
    renderFailed?: boolean;
    // false when the page around it owns every notice (/preview, spec 0013)
    showNotices?: boolean;
    // Fires after each canvas swap with the pages now on screen, and with 0 on unmount
    onPageCount?: (count: number) => void;
    // Fires when a draw fails; the pages drawn before it, if any, stay on screen
    onDrawFailed?: () => void;
};

const freeCanvases = (canvases: Iterable<HTMLCanvasElement>) => {
    for (const canvas of canvases) {
        canvas.width = 0;
        canvas.height = 0;
    }
};

// Each page sits in a box the browser skips while it is scrolled out of view
// (content-visibility), so swapping in a long resume paints only the pages on screen
const pageBox = (canvas: HTMLCanvasElement) => {
    const box = document.createElement('div');
    box.className = 'shrink-0 [content-visibility:auto]';
    box.style.width = canvas.style.width;
    box.style.height = canvas.style.height;
    box.style.containIntrinsicSize = `${canvas.style.width} ${canvas.style.height}`;
    box.append(canvas);
    return box;
};

const isCancel = (error: unknown) =>
    error instanceof Error && error.name === 'RenderingCancelledException';

const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);

// Draws a PDF page by page, for the builder's live preview and for /preview. A new set of
// canvases replaces the old one in one step only once every page is drawn, so the pages never
// flash blank between updates (spec 0009)
export const PreviewPages = ({
    pdf,
    renderFailed = false,
    showNotices = true,
    onPageCount,
    onDrawFailed,
}: PreviewPagesProps) => {
    const { t } = useTranslation();
    const pagesRef = useRef<HTMLDivElement>(null);
    const docRef = useRef<PDFDocumentProxy | null>(null);
    const handledPdfRef = useRef<ArrayBuffer | null>(null);
    const generationRef = useRef(0);
    const drawnWidthRef = useRef(0);
    const [hasPages, setHasPages] = useState(false);
    const [drawFailed, setDrawFailed] = useState(false);

    const reportPageCount = useEffectEvent((count: number) => onPageCount?.(count));
    const reportDrawFailed = useEffectEvent(() => onDrawFailed?.());

    const measureWidth = () => {
        const width = pagesRef.current?.clientWidth ?? 0;
        return Math.min(width > 0 ? width : MAX_PAGE_CSS_WIDTH, MAX_PAGE_CSS_WIDTH);
    };

    const labelCanvases = (canvases: HTMLCanvasElement[]) => {
        canvases.forEach((canvas, index) => {
            canvas.setAttribute('role', 'img');
            canvas.setAttribute(
                'aria-label',
                t('pdfPreview.pageLabel', { page: index + 1, total: canvases.length }),
            );
            canvas.className = `block ${PAGE_SHEET_CLASS}`;
        });
    };

    // Each draw takes a generation; one a newer draw overtook is thrown away, never swapped in
    const draw = useEffectEvent(async (load: () => Promise<PDFDocumentProxy>) => {
        const generation = ++generationRef.current;
        let doc: PDFDocumentProxy | null = null;
        try {
            doc = await load();
            const width = measureWidth();
            const canvases = await drawPdfPages(doc, width, pixelRatio());
            if (generation !== generationRef.current || !pagesRef.current) {
                freeCanvases(canvases);
                if (doc !== docRef.current) destroyPdf(doc);
                return;
            }
            labelCanvases(canvases);
            const old = Array.from(pagesRef.current.querySelectorAll('canvas'));
            pagesRef.current.replaceChildren(...canvases.map(pageBox));
            freeCanvases(old);
            const previous = docRef.current;
            docRef.current = doc;
            if (previous && previous !== doc) destroyPdf(previous);
            drawnWidthRef.current = width;
            setHasPages(canvases.length > 0);
            setDrawFailed(false);
            reportPageCount(canvases.length);
        } catch (error) {
            if (doc && doc !== docRef.current) destroyPdf(doc);
            if (generation !== generationRef.current || isCancel(error)) return;
            setDrawFailed(true);
            reportDrawFailed();
        }
    });

    useEffect(() => {
        // Draw each PDF once per mount (StrictMode replays the effect); a remount, such as a
        // reopened panel or sheet, draws the kept PDF again, which loadPdf allows as it copies it
        if (!pdf || pdf === handledPdfRef.current) return;
        handledPdfRef.current = pdf;
        void draw(() => loadPdf(pdf));
    }, [pdf]);

    const redrawAtNewWidth = useEffectEvent(() => {
        const doc = docRef.current;
        if (!doc) return;
        if (Math.abs(measureWidth() - drawnWidthRef.current) < RESIZE_MIN_CHANGE_PX) return;
        void draw(async () => doc);
    });

    useEffect(() => {
        const node = pagesRef.current;
        if (!node) return;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const observer = new ResizeObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(redrawAtNewWidth, RESIZE_DEBOUNCE_MS);
        });
        observer.observe(node);
        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, []);

    useEffect(
        () => () => {
            generationRef.current += 1;
            if (docRef.current) destroyPdf(docRef.current);
            docRef.current = null;
            reportPageCount(0);
        },
        [],
    );

    return (
        <div className='space-y-3'>
            {showNotices && (renderFailed || drawFailed) && (
                <p role='status' className={`${WARNING_NOTICE_CLASS} px-3 py-2`}>
                    {t('pdfPreview.updateFailed')}
                </p>
            )}
            {showNotices && !hasPages && (
                <p role='status' className='text-muted-foreground py-12 text-center text-sm'>
                    {t('pdfPreview.preparing')}
                </p>
            )}
            <div ref={pagesRef} className={`mx-auto flex flex-col gap-4 ${PAGE_MAX_WIDTH_CLASS}`} />
        </div>
    );
};
