import { afterEach, describe, expect, it } from 'vitest';

import { render, screen } from '@/test/test-utils';
import i18n from '@/test/i18n-test';
import { TemplateCardPreview } from './template-card-preview';

afterEach(async () => {
    await i18n.changeLanguage('en');
});

describe('TemplateCardPreview', () => {
    it('should show the English image with a fixed size when the language is English', () => {
        render(<TemplateCardPreview templateId='veterinary' />);

        const image = screen.getByRole('img', {
            name: 'Veterinary Template template preview with sample resume',
        });
        expect(image.getAttribute('src')).toContain('veterinary-en.webp');
        expect(image).toHaveAttribute('width', '1190');
        expect(image).toHaveAttribute('height', '1684');
        expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('should show the Polish image when the language is a Polish locale', async () => {
        await i18n.changeLanguage('pl-PL');
        render(<TemplateCardPreview templateId='developer' />);

        expect(screen.getByRole('img').getAttribute('src')).toContain('developer-pl.webp');
    });
});
