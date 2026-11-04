import type { ResumeFormValues } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import { getPDFStrings } from '@/features/templates/model/template-strings';
import { lineText } from '@/features/pdf/import/text-lines';
import type { TextLine } from '@/features/pdf/import/text-lines';

const collapse = (text: string) => text.replace(/\s+/gu, ' ').trim();

const MARK = '\u0000';

// The GDPR clause at the bottom: the generic text, or the one naming a company.
export function readGdpr(
    footer: readonly TextLine[],
    lang: AppLang,
): ResumeFormValues['gdprConsent'] {
    const none = { enabled: false, companyName: '' };
    if (footer.length === 0) return none;
    const text = collapse(footer.map(lineText).join(' '));
    const strings = getPDFStrings(lang);
    if (text === collapse(strings.gdprConsentGeneric)) return { enabled: true, companyName: '' };

    const [before, after] = collapse(strings.gdprConsent(MARK)).split(MARK);
    if (
        text.length > before.length + after.length &&
        text.startsWith(before) &&
        text.endsWith(after)
    ) {
        const companyName = text.slice(before.length, text.length - after.length).trim();
        return { enabled: true, companyName };
    }
    return none;
}
