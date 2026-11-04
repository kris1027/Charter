import { PdfImportError } from '@/features/pdf/import/pdf-import-error';
import { readPdfSource } from '@/features/pdf/import/read-pdf-source';
import type { Pdfjs } from '@/features/pdf/import/read-pdf-source';

const textItem = (str: string, y: number) => ({ str, transform: [9, 0, 0, 9, 20, y], width: 9 });

type FakePage = { items: object[]; annotations: Record<string, unknown>[]; fail?: boolean };

const fakePdfjs = (
    pages: FakePage[],
    { info = {}, openError }: { info?: Record<string, unknown>; openError?: Error } = {},
) => {
    const destroy = vi.fn(async () => {});
    const pdf = {
        numPages: pages.length,
        getMetadata: async () => ({ info }),
        getPage: async (n: number) => {
            const page = pages[n - 1];
            if (page.fail) throw new Error('broken page');
            return {
                getTextContent: async () => ({ items: page.items }),
                getAnnotations: async () => page.annotations,
            };
        },
    };
    const getDocument = vi.fn(() => ({
        promise: openError ? Promise.reject(openError) : Promise.resolve(pdf),
        destroy,
    }));
    return { pdfjs: { getDocument } as unknown as Pdfjs, getDocument, destroy };
};

const named = (name: string) => Object.assign(new Error(name), { name });

describe('readPdfSource', () => {
    it('should read creator, lines and links of every page from one open', async () => {
        const { pdfjs, getDocument, destroy } = fakePdfjs(
            [
                { items: [textItem('Anna', 790)], annotations: [{ url: 'https://a.dev/' }] },
                {
                    items: [textItem('// SKILLS', 700)],
                    annotations: [{ unsafeUrl: 'anna.dev' }, { url: 42 }, {}],
                },
            ],
            { info: { Creator: '{"v":1}' } },
        );

        const source = await readPdfSource(new Uint8Array([1]), pdfjs);

        expect(getDocument).toHaveBeenCalledTimes(1);
        expect(destroy).toHaveBeenCalledTimes(1);
        expect(source.metadataCreator).toBe('{"v":1}');
        expect(source.lines.map((l) => [l.page, l.runs[0].text])).toEqual([
            [1, 'Anna'],
            [2, '// SKILLS'],
        ]);
        expect(source.linkUrls).toEqual(['https://a.dev/', 'anna.dev']);
    });

    it('should leave the creator undefined when it is not a string', async () => {
        const { pdfjs } = fakePdfjs([], { info: { Creator: 3 } });
        expect((await readPdfSource(new Uint8Array(), pdfjs)).metadataCreator).toBeUndefined();
    });

    it('should destroy the task and report invalid when a page read throws', async () => {
        const { pdfjs, destroy } = fakePdfjs([{ items: [], annotations: [], fail: true }]);
        await expect(readPdfSource(new Uint8Array(), pdfjs)).rejects.toMatchObject({
            code: 'invalid',
        });
        expect(destroy).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['PasswordException', 'password'],
        ['InvalidPDFException', 'invalid'],
        ['Error', 'invalid'],
    ])('should map %s to a %s import error when the PDF cannot open', async (name, code) => {
        const { pdfjs, destroy } = fakePdfjs([], { openError: named(name) });
        const err = await readPdfSource(new Uint8Array(), pdfjs).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(PdfImportError);
        expect(err).toMatchObject({ code });
        expect(destroy).toHaveBeenCalledTimes(1);
    });
});
