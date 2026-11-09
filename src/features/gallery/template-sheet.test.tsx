import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TemplateSheet } from '@/features/gallery/template-sheet';
import i18n from '@/test/i18n-test';
import { render, screen } from '@/test/test-utils';

const SIZES = '(min-width: 1024px) 340px, 80vw';

afterEach(async () => {
    await i18n.changeLanguage('en');
});

describe('TemplateSheet', () => {
    it('should offer both file sizes in the current language when sizes is set', async () => {
        await i18n.changeLanguage('pl-PL');
        render(<TemplateSheet templateId='developer' sizes={SIZES} />);

        const image = screen.getByRole('img');
        expect(image.getAttribute('src')).toContain('developer-pl-card.webp');
        const srcset = image.getAttribute('srcset');
        expect(srcset).toMatch(/developer-pl-card\.webp 720w/);
        expect(srcset).toMatch(/developer-pl\.webp 1190w/);
        expect(image).toHaveAttribute('sizes', SIZES);
        expect(image).toHaveAttribute('width', '1190');
        expect(image).toHaveAttribute('height', '1684');
    });

    it('should use the full file alone when sizes is not set', () => {
        render(<TemplateSheet templateId='veterinary' />);

        const image = screen.getByRole('img', {
            name: 'Veterinary Template preview with sample resume',
        });
        expect(image.getAttribute('src')).toContain('veterinary-en.webp');
        expect(image).not.toHaveAttribute('srcset');
    });

    it('should load eagerly at high priority when it is a priority sheet', () => {
        render(<TemplateSheet templateId='default' isPriority />);

        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('loading', 'eager');
        expect(image).toHaveAttribute('fetchpriority', 'high');
        expect(image).toHaveAttribute('decoding', 'async');
    });

    it('should load lazily when it is not a priority sheet', () => {
        render(<TemplateSheet templateId='default' />);

        expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');
    });

    it('should hide the image and keep the sheet when the image fails', () => {
        const { container } = render(<TemplateSheet templateId='default' />);
        const image = screen.getByRole('img');

        fireEvent.error(image);

        expect(image).toHaveAttribute('hidden');
        expect(container.firstElementChild).toHaveClass('bg-paper');
    });

    it('should show the image again when the language changes after a failure', async () => {
        render(<TemplateSheet templateId='default' />);
        const image = screen.getByRole('img');
        fireEvent.error(image);

        await i18n.changeLanguage('pl');

        expect(await screen.findByRole('img')).not.toHaveAttribute('hidden');
    });
});
