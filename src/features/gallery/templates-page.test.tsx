import { afterEach, describe, expect, it } from 'vitest';

import { TemplatesPage } from '@/features/gallery/templates-page';
import { safeStorage } from '@/lib/storage';
import { renderWithRouter, screen, within } from '@/test/test-utils';

const renderPage = () => renderWithRouter(TemplatesPage);

afterEach(() => {
    safeStorage.removeItem('resumeData');
    safeStorage.removeItem('resumeData_lastSaved');
});

describe('TemplatesPage', () => {
    it('should render one h1 and a heading per template in order when the page loads', async () => {
        await renderPage();

        expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual([
            'Choose Your CV Template',
        ]);
        expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
            'Developer Template',
            'Default Template',
            'Veterinary Template',
        ]);
    });

    it('should link the sheet and both buttons to the right pages when a card renders', async () => {
        await renderPage();
        const card = screen
            .getByRole('heading', { name: 'Veterinary Template' })
            .closest('article');
        const links = within(card as HTMLElement);

        expect(
            links.getByRole('link', { name: 'Veterinary Template preview with sample resume' }),
        ).toHaveAttribute('href', '/templates/veterinary');
        const preview = links.getByRole('link', { name: 'Preview' });
        expect(preview).toHaveAttribute('href', '/templates/veterinary');
        expect(preview).toHaveAttribute('aria-describedby', 'template-name-veterinary');
        const use = links.getByRole('link', { name: 'Use Template' });
        expect(use).toHaveAttribute('href', '/builder?templateId=veterinary');
        expect(use).toHaveAttribute('aria-describedby', 'template-name-veterinary');
    });

    it('should prioritize only the first card image when the page loads', async () => {
        await renderPage();

        expect(screen.getAllByRole('img').map((image) => image.getAttribute('loading'))).toEqual([
            'eager',
            'lazy',
            'lazy',
        ]);
    });

    it('should show the notice with a plain builder link when a resume is saved', async () => {
        safeStorage.setItem('resumeData', JSON.stringify({ templateId: 'default' }));
        await renderPage();

        expect(screen.getByText('You have saved CV data')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Continue editing' })).toHaveAttribute(
            'href',
            '/builder',
        );
        expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
    });

    it('should show the time since the last save when a valid time is stored', async () => {
        safeStorage.setItem('resumeData', '{}');
        safeStorage.setItem(
            'resumeData_lastSaved',
            new Date(Date.now() - 2 * 60_000).toISOString(),
        );
        await renderPage();

        expect(screen.getByText('Last saved 2 minutes ago')).toBeInTheDocument();
    });

    it('should say just now when the save is under a minute old', async () => {
        safeStorage.setItem('resumeData', '{}');
        safeStorage.setItem('resumeData_lastSaved', new Date().toISOString());
        await renderPage();

        expect(screen.getByText('Last saved just now')).toBeInTheDocument();
    });

    it('should leave out the last saved line when the stored time is invalid', async () => {
        safeStorage.setItem('resumeData', '{}');
        safeStorage.setItem('resumeData_lastSaved', 'garbage');
        await renderPage();

        expect(screen.getByText('You have saved CV data')).toBeInTheDocument();
        expect(screen.queryByText(/Last saved/)).not.toBeInTheDocument();
    });

    it('should not show the notice when nothing is saved', async () => {
        await renderPage();

        expect(screen.queryByText('You have saved CV data')).not.toBeInTheDocument();
    });

    it('should not show the notice when the saved data is broken', async () => {
        safeStorage.setItem('resumeData', '{not json');
        await renderPage();

        expect(screen.queryByText('You have saved CV data')).not.toBeInTheDocument();
    });
});
