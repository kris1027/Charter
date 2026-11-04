export type PdfImportErrorCode = 'invalid' | 'password' | 'unrecognized';

// An import failure the user can be told about; the dialog shows `dialogs.pdfError.<code>`.
export class PdfImportError extends Error {
    readonly code: PdfImportErrorCode;

    constructor(code: PdfImportErrorCode, options?: { cause?: unknown }) {
        super(`PDF import failed: ${code}`, options);
        this.name = 'PdfImportError';
        this.code = code;
    }
}
