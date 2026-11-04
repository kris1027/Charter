import type { ResumeFormValues } from '@/features/resume/form-types';
import { SECTION_IDS } from '@/features/templates/model/section-ids';
import { detectLayout } from '@/features/pdf/import/detect-layout';
import { PdfImportError } from '@/features/pdf/import/pdf-import-error';
import { readGdpr } from '@/features/pdf/import/read-gdpr';
import { SECTION_FIELDS, SECTION_READERS } from '@/features/pdf/import/readers';
import { readHeader } from '@/features/pdf/import/readers/header';
import { splitSections } from '@/features/pdf/import/split-sections';
import type { TextLine } from '@/features/pdf/import/text-lines';

/**
 * Read a resume from the printed text of a PDF this app exported: detect the template and
 * language, cut the sections, and read each with the template's reader. Website, GitHub and
 * LinkedIn come from the link annotations when there are any.
 */
export function readResumeFromText(
    lines: readonly TextLine[],
    linkUrls: readonly string[] = [],
): ResumeFormValues {
    const detected = detectLayout(lines);
    if (!detected) throw new PdfImportError('unrecognized');
    const { templateId, lang } = detected;
    const slices = splitSections(lines, detected);
    const readers = SECTION_READERS[templateId];

    const result: ResumeFormValues = {
        templateId,
        personalInfo: readHeader(slices.header, { templateId, linkUrls }),
        experiences: [],
        education: [],
        skills: [],
        languages: [],
        interests: [],
        gdprConsent: readGdpr(slices.footer, lang),
    };
    const read = <K extends (typeof SECTION_IDS)[number]>(id: K) => {
        const lines = slices.sections[id];
        if (lines) Object.assign(result, { [SECTION_FIELDS[id]]: readers[id](lines, { lang }) });
    };
    SECTION_IDS.forEach(read);
    return result;
}
