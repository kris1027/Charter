import type { AppLang } from '@/lib/app-lang';
import type { ResumeFormValues } from '@/features/resume/form-types';
import type { SectionReaders } from '@/features/pdf/import/readers';
import { readDateRange, readYearRange } from '@/features/pdf/import/readers/dates';
import { readDegreeField } from '@/features/pdf/import/readers/entries';
import {
    isBullet,
    readBullets,
    readLanguages,
    readTags,
} from '@/features/pdf/import/readers/shared';
import { cells, lineText } from '@/features/pdf/import/text-lines';
import type { TextLine } from '@/features/pdf/import/text-lines';

// Default prints two columns: the title on the left, the dates or years on the right.
const titleRow = <T>(line: TextLine, read: (text: string) => T | null) => {
    if (isBullet(line)) return null;
    const parts = cells(line);
    const value = parts.length > 0 ? read(parts[parts.length - 1]) : null;
    return value && { title: parts.length > 1 ? parts[0] : '', value };
};

// `Position | start - end`, then `Company | location`, then bullets.
const readExperience = (
    lines: readonly TextLine[],
    lang: AppLang,
): ResumeFormValues['experiences'] => {
    const entries: ResumeFormValues['experiences'] = [];
    let i = 0;
    while (i < lines.length) {
        const row = titleRow(lines[i], (text) => readDateRange(text, lang));
        if (!row) {
            i++;
            continue;
        }
        const next = lines[i + 1];
        const hasCompany =
            next && !isBullet(next) && !titleRow(next, (t) => readDateRange(t, lang));
        const [company = '', location = ''] = hasCompany ? cells(next) : [];
        const { bullets, end } = readBullets(lines, hasCompany ? i + 2 : i + 1);
        entries.push({
            company,
            position: row.title,
            location,
            ...row.value,
            description: bullets.join('\n'),
        });
        i = Math.max(end, i + 1);
    }
    return entries;
};

// `Degree in Field | years`, then `Institution`, then the description.
const readEducation = (lines: readonly TextLine[]): ResumeFormValues['education'] => {
    const anchors = lines.flatMap((line, i) => {
        const row = titleRow(line, readYearRange);
        return row ? [{ i, row }] : [];
    });
    return anchors.map(({ i, row }, k) => {
        const end = anchors[k + 1]?.i ?? lines.length;
        const [institution = '', ...description] = lines.slice(i + 1, end).map(lineText);
        return {
            ...readDegreeField(row.title),
            institution,
            ...row.value,
            description: description.join('\n'),
        };
    });
};

export const readers = {
    experience: (lines, { lang }) => readExperience(lines, lang),
    education: readEducation,
    skills: readTags,
    languages: readLanguages,
    interests: readTags,
} satisfies SectionReaders;
