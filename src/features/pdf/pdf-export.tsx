import type { ResumeData } from '@/features/resume/form-types';
import type { TemplateId } from '@/lib/template-ids';
import { normalizeLang, type AppLang } from '@/lib/app-lang';
import { getPdfjs } from '@/features/pdf/pdfjs-singleton';

export interface PDFExportOptions {
    filename?: string;
    compactScale?: number;
    lang?: string;
}

// Renders one template to a PDF blob, loading the @react-pdf engine on demand (spec 0008)
export async function renderResumePdf(
    resumeData: ResumeData,
    templateId: TemplateId,
    compactScale: number,
    lang: AppLang,
): Promise<Blob> {
    const [{ pdf }, { TemplatePDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/features/templates/pdf/template-pdf'),
    ]);

    return pdf(
        <TemplatePDF
            data={resumeData}
            templateId={templateId}
            compactScale={compactScale}
            lang={lang}
        />,
    ).toBlob();
}

export async function exportToPDF(
    resumeData: ResumeData,
    templateId: TemplateId,
    options: PDFExportOptions = {},
): Promise<void> {
    const { filename = 'resume.pdf', compactScale = 0, lang: rawLang = 'en' } = options;
    const blob = await renderResumePdf(
        resumeData,
        templateId,
        compactScale,
        normalizeLang(rawLang),
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    requestAnimationFrame(() => setTimeout(() => URL.revokeObjectURL(url), 1000));
}

export async function countPdfPages(blob: Blob): Promise<number> {
    const { getDocument } = await getPdfjs();
    const buf = await blob.arrayBuffer();
    const loadingTask = getDocument({ data: new Uint8Array(buf) });
    try {
        const pdfDoc = await loadingTask.promise;
        return pdfDoc.numPages;
    } catch {
        return 1;
    } finally {
        await loadingTask.destroy();
    }
}

export function generateResumeFilename(firstName?: string, lastName?: string): string {
    const nameParts = [firstName, lastName].filter(Boolean);
    const name = nameParts.length > 0 ? nameParts.join('-') : 'my';
    return `${name}-Resume.pdf`;
}
