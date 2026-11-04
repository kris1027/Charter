import type { AppLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';
import type { SectionId } from '@/features/templates/model/section-ids';
import { printedTitle } from '@/features/templates/model/printed-title';
import { headerText } from '@/features/pdf/import/text-lines';
import type { TextLine } from '@/features/pdf/import/text-lines';

type HeaderMatch = 'includes' | 'equals';

// Headers older exports printed (or that the parser always accepted), so they still import.
// They count for English only.
export const LEGACY_HEADERS: Partial<
    Record<TemplateId, Partial<Record<SectionId, readonly string[]>>>
> = {
    default: {
        experience: ['Professional Experience'],
        education: ['Education'],
        skills: ['Core Competencies'],
        languages: ['Languages'],
        interests: ['Interests'],
    },
    veterinary: {
        experience: ['Work Experience'],
        education: ['EDUCATION'],
        skills: ['SKILLS'],
        languages: ['LANGUAGES'],
        interests: ['Interests'],
    },
};

type MatchModes = Record<SectionId, { title: HeaderMatch; legacy: HeaderMatch }>;

const sameMode = (mode: HeaderMatch): MatchModes => ({
    experience: { title: mode, legacy: mode },
    education: { title: mode, legacy: mode },
    skills: { title: mode, legacy: mode },
    languages: { title: mode, legacy: mode },
    interests: { title: mode, legacy: mode },
});

// How each template's header lines are compared, kept from the old parser.
export const HEADER_MATCH: Record<TemplateId, MatchModes> = {
    developer: sameMode('includes'),
    default: sameMode('equals'),
    veterinary: {
        ...sameMode('includes'),
        skills: { title: 'equals', legacy: 'equals' },
        languages: { title: 'equals', legacy: 'equals' },
        // An old export's plain `Interests` header only ever matched a whole line.
        interests: { title: 'includes', legacy: 'equals' },
    },
};

const matches = (text: string, header: string, match: HeaderMatch) =>
    match === 'includes' ? text.includes(header) : text === header;

// The index of the line that prints this section's header, or -1. Case sensitive, compared
// with the line's header text (letter spaced headers such as default's closed up again).
export function findHeaderIndex(
    lines: readonly TextLine[],
    templateId: TemplateId,
    sectionId: SectionId,
    lang: AppLang,
): number {
    const title = printedTitle(templateId, sectionId, lang);
    const legacy = lang === 'en' ? (LEGACY_HEADERS[templateId]?.[sectionId] ?? []) : [];
    const mode = HEADER_MATCH[templateId][sectionId];
    return lines.findIndex((line) => {
        const text = headerText(line);
        return (
            matches(text, title, mode.title) ||
            legacy.some((header) => matches(text, header, mode.legacy))
        );
    });
}
