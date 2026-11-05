import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BuilderPage from '@/features/builder/builder-page';
import { WIDE_PREVIEW_QUERY } from '@/features/builder/live-preview/live-preview-panel';
import {
    createPreviewClient,
    type PreviewClient,
    type PreviewClientStatus,
} from '@/features/pdf/live-preview/preview-client';
import type { TemplatePdfInput } from '@/features/templates/pdf/template-pdf';
import { renderWithRouter, screen, userEvent, waitFor } from '@/test/test-utils';

vi.mock('@/features/pdf/live-preview/preview-client', () => ({ createPreviewClient: vi.fn() }));

let requests: TemplatePdfInput[] = [];
let emitStatus: (status: PreviewClientStatus) => void = () => {};

const fakeClient = (): PreviewClient => ({
    request: (input) => requests.push(input),
    onResult: () => {},
    onStatus: (callback) => {
        emitStatus = callback;
    },
    dispose: () => {},
});

// Only the builder's breakpoint query matches on a wide screen; the theme query never does
const setWidth = (wide: boolean) => {
    window.matchMedia = (query: string) =>
        ({
            matches: wide && query === WIDE_PREVIEW_QUERY,
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
        }) as MediaQueryList;
};

const panel = () => screen.queryByRole('complementary', { name: 'Live preview' });

describe('builder live preview layout', () => {
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
        localStorage.clear();
        requests = [];
        vi.mocked(createPreviewClient).mockReset();
        vi.mocked(createPreviewClient).mockImplementation(fakeClient);
    });

    afterEach(() => {
        window.matchMedia = originalMatchMedia;
    });

    it('should show the panel and request a render when the screen is wide', async () => {
        setWidth(true);

        await renderWithRouter(BuilderPage);

        expect(panel()).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Hide preview' })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        expect(screen.getByText('Preparing preview…')).toBeInTheDocument();
        expect(createPreviewClient).toHaveBeenCalledTimes(1);
        expect(requests).toHaveLength(1);
    });

    it('should store the choice and hide the panel when the toggle is pressed', async () => {
        const user = userEvent.setup();
        setWidth(true);
        const { unmount } = await renderWithRouter(BuilderPage);

        await user.click(screen.getByRole('button', { name: 'Hide preview' }));

        expect(localStorage.getItem('builderPreviewOpen')).toBe('0');
        expect(panel()).not.toBeInTheDocument();

        unmount();
        vi.mocked(createPreviewClient).mockClear();
        requests = [];
        await renderWithRouter(BuilderPage);

        expect(panel()).not.toBeInTheDocument();
        expect(createPreviewClient).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Show preview' }));
        expect(localStorage.getItem('builderPreviewOpen')).toBe('1');
        expect(panel()).toBeInTheDocument();
        expect(requests).toHaveLength(1);
    });

    it('should start no worker when the screen is narrow and the sheet is still closed', async () => {
        const user = userEvent.setup();
        setWidth(false);
        await renderWithRouter(BuilderPage);

        expect(panel()).not.toBeInTheDocument();
        expect(createPreviewClient).not.toHaveBeenCalled();

        const openButton = screen.getByRole('button', { name: 'Preview' });
        await user.click(openButton);

        const sheet = screen.getByRole('dialog', { name: /Live preview/ });
        expect(sheet).toBeInTheDocument();
        expect(requests).toHaveLength(1);

        await user.keyboard('{Escape}');

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(openButton).toHaveFocus();
    });

    it('should close the sheet when the labelled close button is pressed', async () => {
        const user = userEvent.setup();
        setWidth(false);
        await renderWithRouter(BuilderPage);
        await user.click(screen.getByRole('button', { name: 'Preview' }));

        await user.click(screen.getByRole('button', { name: 'Close preview' }));

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('should offer the gated Open preview button when the worker is unavailable', async () => {
        setWidth(true);
        await renderWithRouter(BuilderPage);

        act(() => emitStatus('unavailable'));

        expect(screen.getByText('Live preview is unavailable here')).toBeInTheDocument();
        // An empty form is under 30% progress, the same rule as Preview CV
        expect(screen.getByRole('button', { name: 'Open preview' })).toBeDisabled();
    });
});
