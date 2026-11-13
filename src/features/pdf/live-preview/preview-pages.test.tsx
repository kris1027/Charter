import { act } from '@testing-library/react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { destroyPdf, drawPdfPages, loadPdf } from '@/features/pdf/live-preview/draw-pdf-pages';
import { PreviewPages } from '@/features/pdf/live-preview/preview-pages';
import { render, screen, waitFor } from '@/test/test-utils';

vi.mock('@/features/pdf/live-preview/draw-pdf-pages', () => ({
    loadPdf: vi.fn(),
    drawPdfPages: vi.fn(),
    destroyPdf: vi.fn(),
}));

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

const fakeDoc = (name: string) => ({ name }) as unknown as PDFDocumentProxy;

const canvases = (count: number, tag: string) =>
    Array.from({ length: count }, () => {
        const canvas = document.createElement('canvas');
        canvas.dataset.tag = tag;
        return canvas;
    });

const pageImages = () => screen.queryAllByRole('img');
const tags = () => pageImages().map((node) => (node as HTMLElement).dataset.tag);

let resizeCallback: () => void = () => {};

describe('PreviewPages', () => {
    beforeEach(() => {
        vi.mocked(loadPdf).mockReset();
        vi.mocked(drawPdfPages).mockReset();
        vi.mocked(destroyPdf).mockReset();
        vi.mocked(loadPdf).mockImplementation(async (pdf) => fakeDoc(String(pdf.byteLength)));
        globalThis.ResizeObserver = class {
            constructor(callback: ResizeObserverCallback) {
                resizeCallback = () => callback([], this);
            }
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should show the shared placeholder when no pages are drawn yet', () => {
        render(<PreviewPages pdf={null} renderFailed={false} />);

        expect(screen.getByText('Preparing preview…')).toBeInTheDocument();
    });

    it('should label each page and hide the placeholder when the pages are drawn', async () => {
        vi.mocked(drawPdfPages).mockResolvedValue(canvases(3, 'a'));

        render(<PreviewPages pdf={new ArrayBuffer(1)} />);

        expect(
            await screen.findByRole('img', { name: 'Resume preview, page 2 of 3' }),
        ).toBeInTheDocument();
        expect(screen.queryByText('Preparing preview…')).not.toBeInTheDocument();
    });

    it('should report the page count after each swap and 0 when it unmounts', async () => {
        const onPageCount = vi.fn();
        vi.mocked(drawPdfPages)
            .mockResolvedValueOnce(canvases(3, 'a'))
            .mockResolvedValueOnce(canvases(1, 'b'));
        const { rerender, unmount } = render(
            <PreviewPages pdf={new ArrayBuffer(1)} onPageCount={onPageCount} />,
        );
        await screen.findAllByRole('img');
        expect(onPageCount).toHaveBeenLastCalledWith(3);

        rerender(<PreviewPages pdf={new ArrayBuffer(2)} onPageCount={onPageCount} />);
        await waitFor(() => expect(onPageCount).toHaveBeenLastCalledWith(1));

        unmount();
        expect(onPageCount).toHaveBeenLastCalledWith(0);
    });

    it('should show no notice of its own when the notices are turned off', async () => {
        vi.mocked(drawPdfPages).mockRejectedValue(new Error('broken'));

        render(<PreviewPages pdf={new ArrayBuffer(1)} renderFailed showNotices={false} />);
        await act(async () => {});

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should keep the old pages, then swap in one step, when a new set is drawn', async () => {
        vi.mocked(drawPdfPages).mockResolvedValueOnce(canvases(2, 'old'));
        const { rerender } = render(<PreviewPages pdf={new ArrayBuffer(1)} renderFailed={false} />);
        await screen.findAllByRole('img');
        const next = deferred<HTMLCanvasElement[]>();
        vi.mocked(drawPdfPages).mockReturnValueOnce(next.promise);

        rerender(<PreviewPages pdf={new ArrayBuffer(2)} renderFailed={false} />);
        await act(async () => {});
        expect(tags()).toEqual(['old', 'old']);

        await act(async () => next.resolve(canvases(3, 'new')));

        expect(tags()).toEqual(['new', 'new', 'new']);
        expect(destroyPdf).toHaveBeenCalledWith(fakeDoc('1'));
    });

    it('should never swap in an older draw when it finishes after a newer one', async () => {
        const slow = deferred<HTMLCanvasElement[]>();
        vi.mocked(drawPdfPages)
            .mockReturnValueOnce(slow.promise)
            .mockResolvedValueOnce(canvases(1, 'newer'));
        const { rerender } = render(<PreviewPages pdf={new ArrayBuffer(1)} renderFailed={false} />);

        rerender(<PreviewPages pdf={new ArrayBuffer(2)} renderFailed={false} />);
        await screen.findByRole('img');
        await act(async () => slow.resolve(canvases(2, 'older')));

        expect(tags()).toEqual(['newer']);
    });

    it('should keep the old pages and show the notice when a draw fails', async () => {
        vi.mocked(drawPdfPages)
            .mockResolvedValueOnce(canvases(1, 'old'))
            .mockRejectedValueOnce(new Error('broken'));
        const { rerender } = render(<PreviewPages pdf={new ArrayBuffer(1)} renderFailed={false} />);
        await screen.findByRole('img');

        rerender(<PreviewPages pdf={new ArrayBuffer(2)} renderFailed={false} />);

        expect(await screen.findByText('Preview could not update')).toHaveAttribute(
            'role',
            'status',
        );
        expect(tags()).toEqual(['old']);
    });

    it('should show no notice when a draw is cancelled', async () => {
        const cancel = Object.assign(new Error('cancelled'), {
            name: 'RenderingCancelledException',
        });
        vi.mocked(drawPdfPages)
            .mockResolvedValueOnce(canvases(1, 'old'))
            .mockRejectedValueOnce(cancel);
        const { rerender } = render(<PreviewPages pdf={new ArrayBuffer(1)} renderFailed={false} />);
        await screen.findByRole('img');

        rerender(<PreviewPages pdf={new ArrayBuffer(2)} renderFailed={false} />);
        await act(async () => {});

        expect(screen.queryByText('Preview could not update')).not.toBeInTheDocument();
    });

    it('should show the notice when the render failed in the worker', () => {
        render(<PreviewPages pdf={null} renderFailed />);

        expect(screen.getByText('Preview could not update')).toBeInTheDocument();
    });

    it('should redraw the kept document at the new width when the panel resizes', async () => {
        const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(600);
        vi.mocked(drawPdfPages).mockResolvedValue(canvases(1, 'a'));
        render(<PreviewPages pdf={new ArrayBuffer(1)} renderFailed={false} />);
        await screen.findByRole('img');
        vi.useFakeTimers();

        width.mockReturnValue(604);
        act(() => resizeCallback());
        await act(async () => vi.advanceTimersByTime(150));
        expect(drawPdfPages).toHaveBeenCalledTimes(1);

        width.mockReturnValue(1200);
        act(() => resizeCallback());
        await act(async () => vi.advanceTimersByTime(150));

        expect(drawPdfPages).toHaveBeenCalledTimes(2);
        // Same document, never the transferred bytes again; width capped at 900
        expect(loadPdf).toHaveBeenCalledTimes(1);
        expect(vi.mocked(drawPdfPages).mock.calls[1].slice(0, 2)).toEqual([fakeDoc('1'), 900]);
    });
});
