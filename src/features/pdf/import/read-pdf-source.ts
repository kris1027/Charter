import { getPdfjs } from '@/features/pdf/pdfjs-singleton';
import { PdfImportError } from '@/features/pdf/import/pdf-import-error';
import { buildTextLines } from '@/features/pdf/import/text-lines';
import type { TextLine } from '@/features/pdf/import/text-lines';

// Everything the import needs from one PDF, read in one open.
export type PdfSource = { metadataCreator?: string; lines: TextLine[]; linkUrls: string[] };

// Tests pass the legacy Node build, the app the lazily loaded browser build.
export type Pdfjs = Pick<typeof import('pdfjs-dist'), 'getDocument'>;

const toImportError = (err: unknown) =>
    err instanceof PdfImportError
        ? err
        : new PdfImportError(
              err instanceof Error && err.name === 'PasswordException' ? 'password' : 'invalid',
              { cause: err },
          );

export async function readPdfSource(data: Uint8Array, pdfjs?: Pdfjs): Promise<PdfSource> {
    const lib = pdfjs ?? (await getPdfjs());
    const task = lib.getDocument({ data });
    try {
        const pdf = await task.promise;
        const { info } = (await pdf.getMetadata()) as { info?: Record<string, unknown> };
        const lines: TextLine[] = [];
        const linkUrls: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            lines.push(...buildTextLines((await page.getTextContent()).items, i));
            for (const annotation of (await page.getAnnotations()) as Record<string, unknown>[]) {
                const url = annotation.url ?? annotation.unsafeUrl;
                if (typeof url === 'string') linkUrls.push(url);
            }
        }
        const creator = info?.Creator;
        return {
            metadataCreator: typeof creator === 'string' ? creator : undefined,
            lines,
            linkUrls,
        };
    } catch (err) {
        throw toImportError(err);
    } finally {
        // Cleanup only: a failed destroy must not replace the source or the import error.
        await task.destroy().catch(() => {});
    }
}
