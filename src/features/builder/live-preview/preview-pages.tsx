import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useTranslation } from 'react-i18next';
import { destroyPdf, drawPdfPages, loadPdf } from '@/features/pdf/live-preview/draw-pdf-pages';

export const MAX_PAGE_CSS_WIDTH = 900;
const RESIZE_DEBOUNCE_MS = 150;
const RESIZE_MIN_CHANGE_PX = 8;

type PreviewPagesProps = {
    pdf: ArrayBuffer | null;
    renderFailed: boolean;
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

// Draws the live preview PDF page by page. A new set of canvases replaces the old one in one
// step only once every page is drawn, so the pages never flash blank between updates (spec 0009)
export const PreviewPages = ({ pdf, renderFailed }: PreviewPagesProps) => {
    const { t } = useTranslation();
    const pagesRef = useRef<HTMLDivElement>(null);
    const docRef = useRef<PDFDocumentProxy | null>(null);
    const handledPdfRef = useRef<ArrayBuffer | null>(null);
    const generationRef = useRef(0);
    const drawnWidthRef = useRef(0);
    const [pageCount, setPageCount] = useState(0);
    const [drawFailed, setDrawFailed] = useState(false);

    const measureWidth = () => {
        const width = pagesRef.current?.clientWidth ?? 0;
        return Math.min(width > 0 ? width : MAX_PAGE_CSS_WIDTH, MAX_PAGE_CSS_WIDTH);
    };

    const labelCanvases = (canvases: HTMLCanvasElement[]) => {
        canvases.forEach((canvas, index) => {
            canvas.setAttribute('role', 'img');
            canvas.setAttribute(
                'aria-label',
                t('builder.livePreview.pageLabel', { page: index + 1, total: canvases.length }),
            );
            canvas.className = 'block bg-white shadow-md ring-1 ring-slate-900/10';
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
            setPageCount(canvases.length);
            setDrawFailed(false);
        } catch (error) {
            if (doc && doc !== docRef.current) destroyPdf(doc);
            if (generation !== generationRef.current || isCancel(error)) return;
            setDrawFailed(true);
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
        },
        [],
    );

    return (
        <div className='space-y-3'>
            {pageCount > 0 && (
                <div className='flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400'>
                    <span className='rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200'>
                        {t('builder.livePreview.pageCount', { count: pageCount })}
                    </span>
                    {pageCount > 1 && <span>{t('builder.livePreview.fullSizeHint')}</span>}
                </div>
            )}
            {(renderFailed || drawFailed) && (
                <p
                    role='status'
                    className='rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200'
                >
                    {t('builder.livePreview.updateFailed')}
                </p>
            )}
            {pageCount === 0 && (
                <p role='status' className='py-12 text-center text-sm text-slate-500'>
                    {t('builder.livePreview.preparing')}
                </p>
            )}
            <div ref={pagesRef} className='mx-auto flex max-w-[900px] flex-col gap-4' />
        </div>
    );
};
