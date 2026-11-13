import type { ResumeData } from '@/features/resume/form-types';
import type { TemplatePdfInput } from '@/features/templates/pdf/template-pdf';
import type { TemplateId } from '@/lib/template-ids';
import { normalizeLang } from '@/lib/app-lang';
import { getPdfjs } from '@/features/pdf/pdfjs-singleton';

export interface PDFExportOptions {
    filename?: string;
    compactScale?: number;
    lang?: string;
}

// Renders one template to a PDF blob, loading the @react-pdf engine on demand (spec 0008)
export async function renderResumePdf(input: TemplatePdfInput): Promise<Blob> {
    const [{ pdf }, { TemplatePDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/features/templates/pdf/template-pdf'),
    ]);

    return pdf(<TemplatePDF {...input} />).toBlob();
}

export async function exportToPDF(
    resumeData: ResumeData,
    templateId: TemplateId,
    options: PDFExportOptions = {},
): Promise<void> {
    const { filename = 'resume.pdf', compactScale = 0, lang: rawLang = 'en' } = options;
    const blob = await renderResumePdf({
        data: resumeData,
        templateId,
        compactScale,
        lang: normalizeLang(rawLang),
    });
    savePdf(blob, filename);
}

// Hands a finished PDF to the browser as a download
export function savePdf(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    requestAnimationFrame(() => setTimeout(() => URL.revokeObjectURL(url), 1000));
}

// Page count of PDF bytes, or null when they cannot be read, so a broken PDF never counts as
// one page. pdf.js takes ownership of the bytes it gets, so it only ever gets a copy
export async function countPdfBytes(pdf: ArrayBuffer): Promise<number | null> {
    try {
        const { getDocument } = await getPdfjs();
        const loadingTask = getDocument({ data: new Uint8Array(pdf.slice(0)) });
        try {
            return (await loadingTask.promise).numPages;
        } finally {
            await loadingTask.destroy();
        }
    } catch {
        return null;
    }
}

export function generateResumeFilename(firstName?: string, lastName?: string): string {
    const nameParts = [firstName, lastName].filter(Boolean);
    const name = nameParts.length > 0 ? nameParts.join('-') : 'my';
    return `${name}-Resume.pdf`;
}
