import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pdf/pdfjs-singleton', () => ({
    getPdfjs: vi.fn(),
}));

import { generateResumeFilename, countPdfPages } from './pdf-export';
import { getPdfjs } from '@/features/pdf/pdfjs-singleton';

describe('generateResumeFilename', () => {
    it('builds filename from first and last name', () => {
        expect(generateResumeFilename('John', 'Doe')).toBe('John-Doe-Resume.pdf');
    });

    it('uses only first name when last name is missing', () => {
        expect(generateResumeFilename('John')).toBe('John-Resume.pdf');
    });

    it('uses only last name when first name is missing', () => {
        expect(generateResumeFilename(undefined, 'Doe')).toBe('Doe-Resume.pdf');
    });

    it('falls back to "my" when no names provided', () => {
        expect(generateResumeFilename()).toBe('my-Resume.pdf');
    });

    it('falls back to "my" when names are empty strings', () => {
        expect(generateResumeFilename('', '')).toBe('my-Resume.pdf');
    });
});

describe('countPdfPages', () => {
    const makeGetDocument = (numPages: number) =>
        vi.fn().mockReturnValue({
            promise: Promise.resolve({ numPages }),
            destroy: vi.fn().mockResolvedValue(undefined),
        });

    it('should return the page count when pdfjs opens the bytes', async () => {
        vi.mocked(getPdfjs).mockResolvedValue({ getDocument: makeGetDocument(3) } as never);

        expect(await countPdfPages(new ArrayBuffer(8))).toBe(3);
    });

    it('should hand pdfjs a copy when counting, so the kept bytes stay usable', async () => {
        const getDocument = makeGetDocument(1);
        vi.mocked(getPdfjs).mockResolvedValue({ getDocument } as never);
        const kept = new ArrayBuffer(8);

        await countPdfPages(kept);

        const { data } = getDocument.mock.calls[0][0] as { data: Uint8Array };
        expect(data.buffer).not.toBe(kept);
        expect(data.byteLength).toBe(8);
    });

    it('should return null when pdfjs cannot read the bytes', async () => {
        vi.mocked(getPdfjs).mockResolvedValue({
            getDocument: vi.fn().mockReturnValue({
                promise: Promise.reject(new Error('parse error')),
                destroy: vi.fn().mockResolvedValue(undefined),
            }),
        } as never);

        expect(await countPdfPages(new ArrayBuffer(8))).toBeNull();
    });
});
