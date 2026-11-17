import { afterEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n/config';
import { pageTitle, routeTitleMeta, templateTitleMeta } from './seo';

describe('pageTitle', () => {
    afterEach(async () => {
        await i18n.changeLanguage('en');
    });

    it('should give the English title when the language is English', async () => {
        await i18n.changeLanguage('en');

        expect(pageTitle('pageTitle.builder')).toBe('Build Your CV | Charter');
    });

    it('should give the Polish title when the language is Polish', async () => {
        await i18n.changeLanguage('pl');

        expect(pageTitle('pageTitle.builder')).toBe('Stwórz swoje CV | Charter');
        expect(pageTitle('pageTitle.template', { name: 'Szablon domyślny' })).toBe(
            'Szablon domyślny | Charter',
        );
    });
});

describe('route title meta', () => {
    afterEach(async () => {
        await i18n.changeLanguage('en');
    });

    it('should give a Polish tab title and English share titles when the language is Polish', async () => {
        await i18n.changeLanguage('pl');

        expect(routeTitleMeta('pageTitle.builder')).toEqual([
            { title: 'Stwórz swoje CV | Charter' },
            { property: 'og:title', content: 'Build Your CV | Charter' },
            { name: 'twitter:title', content: 'Build Your CV | Charter' },
        ]);
    });

    it('should name the template in each language when the template exists', async () => {
        await i18n.changeLanguage('pl');

        expect(templateTitleMeta('default')).toEqual([
            { title: 'Szablon domyślny | Charter' },
            { property: 'og:title', content: 'Default Template | Charter' },
            { name: 'twitter:title', content: 'Default Template | Charter' },
        ]);
    });

    it('should fall back to the raw id when the template is unknown', () => {
        expect(templateTitleMeta('unknown')[0]).toEqual({ title: 'unknown | Charter' });
    });
});
