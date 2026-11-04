import type { SectionId } from '@/features/templates/model/section-ids';
import { SECTION_IDS } from '@/features/templates/model/section-ids';
import type { Detected } from '@/features/pdf/import/detect-layout';
import { findGdprStart } from '@/features/pdf/import/read-gdpr';
import { findHeaderIndex } from '@/features/pdf/import/section-headers';
import type { TextLine } from '@/features/pdf/import/text-lines';

export type SectionSlices = {
    header: TextLine[];
    sections: Partial<Record<SectionId, TextLine[]>>;
    footer: TextLine[];
};

/**
 * Cut the lines into the part above the first section, one slice per section and the GDPR
 * footer. Sections run from their header to the next header found, in the order the PDF
 * prints them; lines of every page are one stream.
 */
export function splitSections(lines: readonly TextLine[], detected: Detected): SectionSlices {
    const found = SECTION_IDS.map((id) => ({
        id,
        index: findHeaderIndex(lines, detected.templateId, id, detected.lang),
    }))
        .filter((h) => h.index >= 0)
        .sort((a, b) => a.index - b.index);

    const firstHeader = found[0]?.index ?? lines.length;
    const footerStart = findGdprStart(lines, firstHeader, detected.lang);
    const end = footerStart >= 0 ? footerStart : lines.length;

    const sections: SectionSlices['sections'] = {};
    found.forEach(({ id, index }, i) => {
        const next = found[i + 1]?.index ?? lines.length;
        sections[id] = lines.slice(index + 1, Math.min(next, end));
    });

    return {
        header: lines.slice(0, firstHeader),
        sections,
        footer: footerStart >= 0 ? lines.slice(footerStart) : [],
    };
}
