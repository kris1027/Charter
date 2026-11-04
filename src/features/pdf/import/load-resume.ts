import type { ResumeFormValues } from '@/features/resume/form-types';
import { parseResumeMetadata } from '@/features/resume/resume-metadata';
import { readPdfSource } from '@/features/pdf/import/read-pdf-source';
import type { PdfSource } from '@/features/pdf/import/read-pdf-source';
import { readResumeFromText } from '@/features/pdf/import/read-resume-text';

// The exact copy exported PDFs embed wins; the printed text is the fallback.
export const resumeFromSource = (source: PdfSource): ResumeFormValues =>
    parseResumeMetadata(source.metadataCreator) ??
    readResumeFromText(source.lines, source.linkUrls);

/** Read a resume PDF back into form values, opening the file once. */
export async function loadResumeFromPDF(file: File): Promise<ResumeFormValues> {
    const source = await readPdfSource(new Uint8Array(await file.arrayBuffer()));
    return resumeFromSource(source);
}
