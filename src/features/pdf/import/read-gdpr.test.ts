import { getPDFStrings } from '@/features/templates/model/template-strings';
import { readGdpr } from '@/features/pdf/import/read-gdpr';
import { lines } from '@/test/pdf-lines';

// The clause wrapped onto two lines at a word boundary, as the templates print it.
const wrapped = (text: string) => {
    const words = text.split(' ');
    const half = Math.ceil(words.length / 2);
    return lines(words.slice(0, half).join(' '), words.slice(half).join(' '));
};

describe('readGdpr', () => {
    it('should be off when there is no footer', () => {
        expect(readGdpr([], 'en')).toEqual({ enabled: false, companyName: '' });
    });

    it('should read the generic clause as enabled without a company', () => {
        expect(readGdpr(wrapped(getPDFStrings('en').gdprConsentGeneric), 'en')).toEqual({
            enabled: true,
            companyName: '',
        });
    });

    it('should read the company name when the Polish clause names one', () => {
        const footer = wrapped(getPDFStrings('pl').gdprConsent('Firma Sp. z o.o.'));
        expect(readGdpr(footer, 'pl')).toEqual({ enabled: true, companyName: 'Firma Sp. z o.o.' });
    });

    it('should be off when the footer text is not the clause of that language', () => {
        expect(readGdpr(wrapped(getPDFStrings('en').gdprConsentGeneric), 'pl')).toEqual({
            enabled: false,
            companyName: '',
        });
    });
});
