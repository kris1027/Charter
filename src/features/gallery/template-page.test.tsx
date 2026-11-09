import type { ComponentProps, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TemplatePage } from '@/features/gallery/template-page';
import type { LazyGalleryPdfViewer } from '@/features/templates/pdf/lazy-gallery-pdf-viewer';
import { renderWithRouter, screen } from '@/test/test-utils';

const mocks = vi.hoisted(() => ({
    templateId: 'developer',
    isDesktop: false,
    viewerRender: vi.fn<(title: string) => void>(),
    viewerThrows: false,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@tanstack/react-router')>()),
    useParams: () => ({ templateId: mocks.templateId }),
}));

vi.mock('@/hooks/use-media-query', () => ({
    useMediaQuery: () => mocks.isDesktop,
}));

vi.mock('@/features/templates/pdf/lazy-gallery-pdf-viewer', () => ({
    LazyGalleryPdfViewer: ({
        title,
        placeholder,
    }: ComponentProps<typeof LazyGalleryPdfViewer>): ReactNode => {
        mocks.viewerRender(title);
        if (mocks.viewerThrows) throw new Error('chunk failed');
        return placeholder;
    },
}));

const renderPage = () => renderWithRouter(TemplatePage);

beforeEach(() => {
    mocks.templateId = 'developer';
    mocks.isDesktop = false;
    mocks.viewerThrows = false;
    mocks.viewerRender.mockClear();
});

describe('TemplatePage', () => {
    it('should show the text and the Use Template link when the template exists', async () => {
        await renderPage();

        expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual([
            'Developer Template',
        ]);
        expect(screen.getByRole('link', { name: 'Use Template' })).toHaveAttribute(
            'href',
            '/builder?templateId=developer',
        );
        expect(screen.getByRole('link', { name: 'Back to Templates' })).toHaveAttribute(
            'href',
            '/templates',
        );
    });

    it('should show the full image and never mount the viewer when below lg', async () => {
        await renderPage();

        const image = screen.getByRole('img', {
            name: 'Developer Template preview with sample resume',
        });
        expect(image.getAttribute('src')).toContain('developer-en.webp');
        expect(image).toHaveAttribute('loading', 'eager');
        expect(image).not.toHaveAttribute('srcset');
        expect(mocks.viewerRender).not.toHaveBeenCalled();
    });

    it('should mount the viewer with the image as placeholder when at lg or wider', async () => {
        mocks.isDesktop = true;
        await renderPage();

        expect(mocks.viewerRender).toHaveBeenCalledWith('Developer Template, sample PDF');
        expect(screen.getByRole('img').getAttribute('src')).toContain('developer-en.webp');
    });

    it('should keep the image and show no error when the viewer fails', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        mocks.isDesktop = true;
        mocks.viewerThrows = true;
        await renderPage();

        expect(screen.getByRole('img').getAttribute('src')).toContain('developer-en.webp');
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
        consoleError.mockRestore();
    });

    it('should show the not found heading and a way back when the id is unknown', async () => {
        mocks.templateId = 'nope';
        await renderPage();

        expect(screen.getByRole('heading', { level: 1, name: 'Template not found' })).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Back to Templates' })).toHaveLength(2);
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
});
