import { PdfImportError } from '@/features/pdf/import/pdf-import-error';

describe('PdfImportError', () => {
    it('should carry its code and cause when it is thrown', () => {
        const cause = new Error('inner');
        const err = new PdfImportError('password', { cause });
        expect(err).toBeInstanceOf(Error);
        expect(err).toMatchObject({ name: 'PdfImportError', code: 'password', cause });
    });
});
