import { act } from '@testing-library/react';
import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
    RouterProvider,
} from '@tanstack/react-router';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/components/theme-provider';
import { drawPdfPages, loadPdf } from '@/features/pdf/live-preview/draw-pdf-pages';
import {
    createPreviewClient,
    type PreviewClient,
    type PreviewClientStatus,
    type PreviewResult,
} from '@/features/pdf/live-preview/preview-client';
import { countPdfBytes, exportToPDF, savePdf } from '@/features/pdf/pdf-export';
import { PreviewPage } from '@/features/preview/preview-page';
import { validatePreviewSearch } from '@/features/preview/preview-search';
import { EMPTY_RESUME } from '@/features/resume/stored-resume';
import type { TemplatePdfInput } from '@/features/templates/pdf/template-pdf';
import { render, screen, userEvent, waitFor, within } from '@/test/test-utils';

vi.mock('@/features/pdf/live-preview/preview-client', () => ({ createPreviewClient: vi.fn() }));
vi.mock('@/features/pdf/live-preview/draw-pdf-pages', () => ({
    loadPdf: vi.fn(),
    drawPdfPages: vi.fn(),
    destroyPdf: vi.fn(),
}));
vi.mock('@/features/pdf/pdf-export', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/features/pdf/pdf-export')>()),
    countPdfBytes: vi.fn(),
    exportToPDF: vi.fn(),
    savePdf: vi.fn(),
}));

// Fake PDF bytes: the page count, then the scale in 64ths
const pdfOf = (pages: number, scale = 0) => Uint8Array.of(pages, Math.round(scale * 64)).buffer;
const pagesOf = (pdf: ArrayBuffer) => new Uint8Array(pdf)[0];

let requests: TemplatePdfInput[] = [];
let emitResult: (result: PreviewResult) => void = () => {};
let emitStatus: (status: PreviewClientStatus) => void = () => {};

const fakeClient = (): PreviewClient => ({
    request: (input) => requests.push(input),
    onResult: (callback) => {
        emitResult = callback;
    },
    onStatus: (callback) => {
        emitStatus = callback;
    },
    dispose: () => {},
});

const respond = (result: PreviewResult) => act(async () => emitResult(result));

// Answers every request as a resume `fullPages` long that fits one page from `fitsFrom` up
const answerAll = async (fullPages: number, fitsFrom: number) => {
    let answered = -1;
    while (requests.length !== answered) {
        answered = requests.length;
        const { compactScale } = requests[requests.length - 1];
        const pages = compactScale === 0 ? fullPages : compactScale >= fitsFrom ? 1 : 2;
        await respond({ ok: true, pdf: pdfOf(pages, compactScale) });
    }
};

const saveResume = (templateId?: string) =>
    localStorage.setItem(
        'resumeData',
        JSON.stringify({
            ...EMPTY_RESUME,
            templateId,
            personalInfo: { ...EMPTY_RESUME.personalInfo, firstName: 'Ada', lastName: 'Lovelace' },
        }),
    );

// The page at /preview with its real search validation, plus stubs for the pages it links to
const renderPreview = async (initialEntry = '/preview') => {
    const rootRoute = createRootRoute({ component: Outlet });
    const stub = (path: string) =>
        createRoute({ getParentRoute: () => rootRoute, path, component: () => <p>{path}</p> });
    const previewRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/preview',
        validateSearch: validatePreviewSearch,
        component: PreviewPage,
    });
    const router = createRouter({
        routeTree: rootRoute.addChildren([previewRoute, stub('/builder'), stub('/templates')]),
        history: createMemoryHistory({ initialEntries: [initialEntry] }),
    });
    await router.load();
    const result = render(
        <ThemeProvider>
            <RouterProvider router={router} />
        </ThemeProvider>,
    );
    // The run sends its first request after a tick
    await act(async () => {});
    return result;
};

const strip = () => screen.getAllByRole('status')[0];
const downloadButton = () => screen.getByRole('button', { name: 'Download PDF' });
const modeSwitch = () => screen.queryByRole('radiogroup', { name: 'Page layout' });

describe('PreviewPage', () => {
    beforeEach(() => {
        localStorage.clear();
        requests = [];
        vi.mocked(createPreviewClient).mockReset().mockImplementation(fakeClient);
        vi.mocked(countPdfBytes)
            .mockReset()
            .mockImplementation(async (pdf) => pagesOf(pdf));
        vi.mocked(exportToPDF).mockReset().mockResolvedValue(undefined);
        vi.mocked(savePdf).mockReset();
        vi.mocked(loadPdf)
            .mockReset()
            .mockImplementation(async (pdf) => ({ numPages: pagesOf(pdf) }) as PDFDocumentProxy);
        vi.mocked(drawPdfPages)
            .mockReset()
            .mockImplementation(async (doc) =>
                Array.from({ length: doc.numPages }, () => document.createElement('canvas')),
            );
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    });

    it('should show a blank sheet and the preparing line until the first render lands', async () => {
        saveResume();
        const { container } = await renderPreview();

        expect(screen.getByText('Preparing preview…')).toHaveAttribute('role', 'status');
        expect(container.querySelector('[data-loading-sheet]')).toBeInTheDocument();
        expect(strip()).toBeEmptyDOMElement();
        expect(container.querySelector('iframe')).not.toBeInTheDocument();

        await answerAll(1, 0);

        expect(
            await screen.findByRole('img', { name: 'Resume preview, page 1 of 1' }),
        ).toBeInTheDocument();
        expect(screen.queryByText('Preparing preview…')).not.toBeInTheDocument();
        expect(container.querySelector('[data-loading-sheet]')).not.toBeInTheDocument();
    });

    it('should show one page, no switch, and save the kept bytes when Download is pressed', async () => {
        const user = userEvent.setup();
        saveResume();
        await renderPreview();
        await answerAll(1, 0);

        expect(strip()).toHaveTextContent('1 page');
        expect(modeSwitch()).not.toBeInTheDocument();

        await user.click(downloadButton());

        expect(savePdf).toHaveBeenCalledTimes(1);
        const [blob, filename] = vi.mocked(savePdf).mock.calls[0];
        expect(blob.type).toBe('application/pdf');
        expect(blob.size).toBe(2);
        expect(filename).toBe('Ada-Lovelace-Resume.pdf');
        expect(exportToPDF).not.toHaveBeenCalled();
        expect(requests).toHaveLength(1);
    });

    it('should show checking, then the switch, and draw one page without a new request', async () => {
        const user = userEvent.setup();
        saveResume();
        await renderPreview();

        await respond({ ok: true, pdf: pdfOf(2) });

        expect(strip()).toHaveTextContent('2 pages · Checking if it fits on one page…');
        // The switch only holds its space while the search runs
        expect(modeSwitch()).not.toBeInTheDocument();

        await answerAll(2, 0.3);

        expect(strip()).toHaveTextContent(/^2 pages$/);
        expect(await screen.findAllByRole('img')).toHaveLength(2);
        const group = modeSwitch()!;
        expect(within(group).getByRole('radio', { name: 'Full size' })).toBeChecked();

        await user.click(within(group).getByRole('radio', { name: 'One page' }));

        expect(strip()).toHaveTextContent(/^1 page$/);
        await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(1));
        expect(requests).toHaveLength(8);

        await user.click(downloadButton());

        // The winner's bytes: one page, rendered at the winning scale
        const [blob] = vi.mocked(savePdf).mock.calls[0];
        expect(new Uint8Array(await blob.arrayBuffer())).toEqual(Uint8Array.of(1, 0.3125 * 64));
        expect(exportToPDF).not.toHaveBeenCalled();
    });

    it('should move between the modes with the arrow keys', async () => {
        const user = userEvent.setup();
        saveResume();
        await renderPreview();
        await answerAll(2, 0.3);
        const group = modeSwitch()!;

        within(group).getByRole('radio', { name: 'Full size' }).focus();
        await user.keyboard('{ArrowRight}');

        expect(within(group).getByRole('radio', { name: 'One page' })).toHaveFocus();
    });

    it('should say too long and show no switch when no scale fits one page', async () => {
        saveResume();
        await renderPreview();

        await answerAll(3, 2);

        expect(strip()).toHaveTextContent('3 pages · Too long for one page');
        expect(modeSwitch()).not.toBeInTheDocument();
    });

    it('should show the notice and export at full size when the worker is unavailable', async () => {
        const user = userEvent.setup();
        saveResume('default');
        await renderPreview();

        act(() => emitStatus('unavailable'));

        expect(
            screen.getByText(
                "The preview can't show in this browser. You can still download the PDF.",
            ),
        ).toHaveAttribute('role', 'status');
        expect(strip()).toBeEmptyDOMElement();
        expect(screen.queryByText('Preparing preview…')).not.toBeInTheDocument();

        await user.click(downloadButton());

        expect(savePdf).not.toHaveBeenCalled();
        expect(exportToPDF).toHaveBeenCalledWith(
            expect.objectContaining({
                personalInfo: expect.objectContaining({ firstName: 'Ada' }),
            }),
            'default',
            { filename: 'Ada-Lovelace-Resume.pdf', compactScale: 0, lang: 'en' },
        );
    });

    it('should keep the pages and save their bytes when the worker crashes mid search', async () => {
        const user = userEvent.setup();
        saveResume();
        await renderPreview();
        await respond({ ok: true, pdf: pdfOf(2) });
        await screen.findAllByRole('img');

        await act(async () => emitStatus('unavailable'));

        expect(screen.getAllByRole('img')).toHaveLength(2);
        expect(strip()).toHaveTextContent(/^2 pages$/);
        expect(modeSwitch()).not.toBeInTheDocument();
        expect(screen.queryByText(/can't show/)).not.toBeInTheDocument();

        await user.click(downloadButton());

        expect(savePdf).toHaveBeenCalledTimes(1);
        expect(exportToPDF).not.toHaveBeenCalled();
    });

    it('should show the failure notice, then the pages, when Try again succeeds', async () => {
        const user = userEvent.setup();
        saveResume();
        await renderPreview();

        await respond({ ok: false });

        expect(screen.getByText('The preview could not be drawn')).toBeInTheDocument();
        expect(strip()).toBeEmptyDOMElement();

        await user.click(screen.getByRole('button', { name: 'Try again' }));
        await answerAll(1, 0);

        expect(await screen.findByRole('img')).toBeInTheDocument();
        expect(screen.queryByText('The preview could not be drawn')).not.toBeInTheDocument();
        expect(strip()).toHaveTextContent('1 page');
    });

    it('should mark Download busy while the fallback export runs', async () => {
        const user = userEvent.setup();
        let finish: () => void = () => {};
        vi.mocked(exportToPDF).mockReturnValue(
            new Promise((resolve) => {
                finish = resolve;
            }),
        );
        saveResume();
        await renderPreview();

        await user.click(downloadButton());

        expect(downloadButton()).toBeDisabled();
        expect(downloadButton()).toHaveAttribute('aria-busy', 'true');

        await act(async () => finish());

        expect(downloadButton()).toBeEnabled();
        expect(downloadButton()).not.toHaveAttribute('aria-busy');
    });

    it('should open the error dialog and return focus to Download when the export fails', async () => {
        const user = userEvent.setup();
        vi.mocked(exportToPDF).mockRejectedValue(new Error('broken'));
        saveResume();
        await renderPreview();

        await user.click(downloadButton());

        const dialog = await screen.findByRole('alertdialog', { name: 'Export Failed' });
        expect(dialog).toHaveTextContent('Failed to export PDF. Please try again.');

        await user.click(within(dialog).getByRole('button', { name: 'OK' }));

        await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
        expect(downloadButton()).toHaveFocus();
    });

    it('should return focus to Download when the error dialog closes with Escape', async () => {
        const user = userEvent.setup();
        vi.mocked(exportToPDF).mockRejectedValue(new Error('broken'));
        saveResume();
        await renderPreview();
        await user.click(downloadButton());
        await screen.findByRole('alertdialog');

        await user.keyboard('{Escape}');

        await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
        expect(downloadButton()).toHaveFocus();
    });

    it('should show the empty card and start no worker when nothing is saved', async () => {
        await renderPreview('/preview?templateId=veterinary');

        expect(
            screen.getByRole('heading', { level: 1, name: 'Your Resume Preview' }),
        ).toBeVisible();
        expect(
            screen.getByRole('heading', { level: 2, name: 'No resume data found' }),
        ).toBeVisible();
        expect(screen.getByRole('link', { name: 'Start Building Your Resume' })).toHaveAttribute(
            'href',
            '/builder?templateId=veterinary',
        );
        expect(screen.getByRole('link', { name: 'Choose a template' })).toHaveAttribute(
            'href',
            '/templates',
        );
        expect(screen.queryByRole('button', { name: 'Download PDF' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Edit Resume' })).not.toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(createPreviewClient).not.toHaveBeenCalled();
    });

    it.each([
        [
            'the search value when it is valid',
            '/preview?templateId=default',
            'veterinary',
            'default',
        ],
        [
            'the saved template when the search value is unknown',
            '/preview?templateId=nope',
            'veterinary',
            'veterinary',
        ],
        [
            'developer when neither is a known template',
            '/preview?templateId=nope',
            'old',
            'developer',
        ],
    ])('should use %s', async (_, entry, saved, expected) => {
        saveResume(saved);
        await renderPreview(entry);

        expect(requests[0].templateId).toBe(expected);
        expect(screen.getByRole('link', { name: 'Edit Resume' })).toHaveAttribute(
            'href',
            `/builder?templateId=${expected}`,
        );
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    });
});
