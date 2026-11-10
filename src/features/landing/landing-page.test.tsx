import { act, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PREVIEW_IMAGES } from '@/features/templates/previews/preview-images';
import IndexPage from '@/features/landing/landing-page';
import { TEMPLATE_IDS } from '@/lib/template-ids';
import i18n from '@/test/i18n-test';
import { renderWithRouter, screen } from '@/test/test-utils';

const renderLanding = () => renderWithRouter(IndexPage);

describe('IndexPage', () => {
    it('should render one h1 and the section headings in order when the page loads', async () => {
        await renderLanding();

        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
        expect(
            screen.getByRole('heading', { level: 1, name: /Build your perfect CV\s+in minutes\./ }),
        ).toBeInTheDocument();
        expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
            'Built for every step of the search.',
            'Three simple steps.',
            'Ready to build your CV?',
        ]);
    });

    it('should render every section in order when the page loads', async () => {
        await renderLanding();
        const heading = (name: string) => screen.getByRole('heading', { name });

        const sections = [
            screen.getByRole('heading', { level: 1 }),
            screen.getByText('Professional tools to create standout resumes.'),
            heading('Built for every step of the search.'),
            heading('Three simple steps.'),
            screen.getByText('Templates'),
            heading('Ready to build your CV?'),
            screen.getByText('Charter · Your data never leaves your browser.'),
        ];

        sections.slice(1).forEach((section, i) => {
            const position = sections[i].compareDocumentPosition(section);
            expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });
    });

    it('should list six feature cards and three steps as h3 when the page loads', async () => {
        await renderLanding();

        expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
            'Professional Templates',
            'Dark Mode',
            'PDF Export',
            'Bilingual Support',
            'Auto-Save',
            'Privacy First',
            'Choose a template',
            'Fill in your details',
            'Download your CV',
        ]);
    });

    it('should point both buttons at the gallery and the text link at the steps when rendered', async () => {
        await renderLanding();

        expect(screen.getByRole('link', { name: 'Start Building Your CV' })).toHaveAttribute(
            'href',
            '/templates',
        );
        expect(screen.getByRole('link', { name: "Get Started — It's Free" })).toHaveAttribute(
            'href',
            '/templates',
        );
        expect(screen.getByRole('link', { name: 'See how it works' })).toHaveAttribute(
            'href',
            '/#how',
        );
    });

    it('should show the previews for the current language and swap them when it changes', async () => {
        await renderLanding();
        const sources = () =>
            screen.getAllByRole('presentation').map((img) => img.getAttribute('src'));

        expect(sources()).toEqual([
            PREVIEW_IMAGES.developer.en,
            PREVIEW_IMAGES.veterinary.en,
            PREVIEW_IMAGES.default.en,
        ]);

        await act(() => i18n.changeLanguage('pl'));
        expect(sources()).toEqual([
            PREVIEW_IMAGES.developer.pl,
            PREVIEW_IMAGES.veterinary.pl,
            PREVIEW_IMAGES.default.pl,
        ]);
        await act(() => i18n.changeLanguage('en'));
    });

    it('should load only the center image eagerly when the hero renders', async () => {
        await renderLanding();
        const [left, right, center] = screen.getAllByRole('presentation');

        expect(center).toHaveAttribute('loading', 'eager');
        expect(center).toHaveAttribute('fetchpriority', 'high');
        for (const side of [left, right]) {
            expect(side).toHaveAttribute('loading', 'lazy');
            expect(side).toHaveAttribute('fetchpriority', 'low');
        }
    });

    it('should hide a preview so no broken icon shows when its image fails', async () => {
        await renderLanding();
        const [, , center] = screen.getAllByRole('presentation', { hidden: true });

        fireEvent.error(center);

        expect(center).not.toBeVisible();
    });

    it('should show the template count and no time claim when the stats render', async () => {
        await renderLanding();

        expect(screen.getByText(String(TEMPLATE_IDS.length))).toBeInTheDocument();
        expect(screen.getByText('Templates')).toBeInTheDocument();
        expect(screen.queryByText('5 min')).not.toBeInTheDocument();
    });

    it('should mark every step active and show the pill when scroll effects are off', async () => {
        await renderLanding();

        expect(screen.queryAllByRole('listitem', { current: 'step' })).toHaveLength(0);
        for (const name of ['Choose a template', 'Fill in your details', 'Download your CV']) {
            expect(screen.getByRole('heading', { name })).toHaveAttribute('data-state', 'active');
        }
        expect(screen.getByText('Download PDF')).toHaveAttribute('data-state', 'visible');
    });

    it('should show the site name and privacy line when the footer renders', async () => {
        await renderLanding();

        expect(
            screen.getByText('Charter · Your data never leaves your browser.'),
        ).toBeInTheDocument();
    });
});
