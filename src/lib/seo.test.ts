import { afterEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n/config';
import { pageTitle } from './seo';

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
