import type { ResumeFormValues } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import { getPDFStrings } from '@/features/templates/model/template-strings';
import { collapse, lineText } from '@/features/pdf/import/text-lines';
import type { TextLine } from '@/features/pdf/import/text-lines';

type GdprConsent = ResumeFormValues['gdprConsent'];

// Stands in for the company name, so the clause splits into the text around it.
const COMPANY_MARK = '\u0000';

// The setting the text encodes when it is exactly the clause of `lang`, else null.
function matchGdpr(text: string, lang: AppLang): GdprConsent | null {
    const strings = getPDFStrings(lang);
    if (text === collapse(strings.gdprConsentGeneric)) return { enabled: true, companyName: '' };

    const [before, after] = collapse(strings.gdprConsent(COMPANY_MARK)).split(COMPANY_MARK);
    if (
        text.length > before.length + after.length &&
        text.startsWith(before) &&
        text.endsWith(after)
    ) {
        const companyName = text.slice(before.length, text.length - after.length).trim();
        return { enabled: true, companyName };
    }
    return null;
}

const joined = (lines: readonly TextLine[]) => collapse(lines.map(lineText).join(' '));

/**
 * The index of the first line after `after` where the clause starts: the lines from there to
 * the end read as exactly the clause of `lang`. -1 when the PDF prints none, so resume text
 * that merely opens with the same words is never cut off as the footer.
 */
export function findGdprStart(lines: readonly TextLine[], after: number, lang: AppLang): number {
    for (let i = after + 1; i < lines.length; i++) {
        if (matchGdpr(joined(lines.slice(i)), lang)) return i;
    }
    return -1;
}

// The GDPR clause at the bottom: the generic text, or the one naming a company.
export const readGdpr = (footer: readonly TextLine[], lang: AppLang): GdprConsent =>
    (footer.length > 0 && matchGdpr(joined(footer), lang)) || {
        enabled: false,
        companyName: '',
    };
