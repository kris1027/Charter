import type { SectionId } from '@/features/templates/model/section-ids';
import { SECTION_IDS } from '@/features/templates/model/section-ids';
import { getPDFStrings } from '@/features/templates/model/template-strings';
import type { Detected } from '@/features/pdf/import/detect-layout';
import { findHeaderIndex } from '@/features/pdf/import/section-headers';
import { lineText } from '@/features/pdf/import/text-lines';
import type { TextLine } from '@/features/pdf/import/text-lines';

export type SectionSlices = {
    header: TextLine[];
    sections: Partial<Record<SectionId, TextLine[]>>;
    footer: TextLine[];
};

// The words the GDPR clause starts with, the same in its company and generic forms.
const gdprOpening = (detected: Detected) => {
    const strings = getPDFStrings(detected.lang);
    const generic = strings.gdprConsentGeneric;
    const withCompany = strings.gdprConsent('\u0000');
    let i = 0;
    while (i < generic.length && generic[i] === withCompany[i]) i++;
    // A few words are enough to tell the clause from resume text.
    return generic.slice(0, i).split(' ').slice(0, 3).join(' ');
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
    const opening = gdprOpening(detected);
    const footerStart = lines.findIndex(
        (line, i) => i > firstHeader && lineText(line).startsWith(opening),
    );
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
