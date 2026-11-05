import { describe, expect, it, vi } from 'vitest';
import { loadPdf } from '@/features/pdf/live-preview/draw-pdf-pages';

const received = vi.hoisted((): Uint8Array[] => []);

const getDocument = vi.hoisted(() =>
    vi.fn((params: { data: Uint8Array }) => {
        received.push(params.data.slice());
        // Like pdf.js: the bytes it is given get transferred to its worker and emptied
        structuredClone(params.data.buffer, { transfer: [params.data.buffer] });
        return { promise: Promise.resolve({}) };
    }),
);

vi.mock('@/features/pdf/pdfjs-singleton', () => ({
    getPdfjs: () => Promise.resolve({ getDocument }),
}));

describe('loadPdf', () => {
    it('should leave the caller its bytes when pdf.js transfers what it was given', async () => {
        const pdf = new Uint8Array([37, 80, 68, 70]).buffer;

        await loadPdf(pdf);
        await loadPdf(pdf);

        expect(pdf.byteLength).toBe(4);
        expect(received).toEqual([
            new Uint8Array([37, 80, 68, 70]),
            new Uint8Array([37, 80, 68, 70]),
        ]);
    });
});
