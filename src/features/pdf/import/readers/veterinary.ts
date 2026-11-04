import type { SectionReaders } from '@/features/pdf/import/readers';
import { readLanguages, readTags, lineSize } from '@/features/pdf/import/readers/shared';
import {
    readDateLine,
    readDegreeField,
    readTimeline,
    readYearsLast,
} from '@/features/pdf/import/readers/entries';
import { lineText } from '@/features/pdf/import/text-lines';
import type { TextLine } from '@/features/pdf/import/text-lines';

// The entry's title line (printed larger than `anchor`) and the plain line after it.
const titleAndPlain = (head: TextLine[], anchor: TextLine): [string, string] => {
    const lastTwo = head.slice(-2);
    if (lastTwo.length === 2) return [lineText(lastTwo[0]), lineText(lastTwo[1])];
    const [only] = lastTwo;
    if (!only) return ['', ''];
    return lineSize(only) > lineSize(anchor) ? [lineText(only), ''] : ['', lineText(only)];
};

// Veterinary prints `Position`, `Company`, then `start - end[ | location]`, then bullets.
// Education prints `Degree in Field` (larger), `Institution`, then the years.
export const readers = {
    experience: (lines, { lang }) =>
        readTimeline(lines, (line) => readDateLine(line, lang)).map(
            ({ head, anchorLine, anchor, description }) => {
                const [position, company] = titleAndPlain(head, anchorLine);
                const { location, ...dates } = anchor;
                return { company, position, location, ...dates, description };
            },
        ),
    education: (lines) =>
        readYearsLast(lines).map(({ head, anchor, years, description }) => {
            const [degreeField, institution] = titleAndPlain(head, anchor);
            return { ...readDegreeField(degreeField), institution, ...years, description };
        }),
    skills: readTags,
    languages: readLanguages,
    interests: readTags,
} satisfies SectionReaders;
