import type { SectionReaders } from '@/features/pdf/import/readers';
import { readLanguages, readTags, lineSize, splitAt } from '@/features/pdf/import/readers/shared';
import { readDateLine, readTimeline, readYearsLast } from '@/features/pdf/import/readers/entries';
import { lineText } from '@/features/pdf/import/text-lines';

// Developer prints `Company | Position`, then `start - end[ | location]`, then bullets.
// Education prints the field (larger), `degree - institution`, then the years.
export const readers = {
    experience: (lines, { lang }) =>
        readTimeline(lines, (line) => readDateLine(line, lang)).map(
            ({ head, anchor, description }) => {
                const last = head.at(-1);
                const [company, position] = last ? splitAt(lineText(last), '|') : ['', ''];
                const { location, ...dates } = anchor;
                return { company, position, location, ...dates, description };
            },
        ),
    education: (lines) =>
        readYearsLast(lines).map(({ head, anchor, years, description }) => {
            const fieldLine = head.find((line) => lineSize(line) > lineSize(anchor));
            const field = fieldLine ? lineText(fieldLine) : '';
            const rest = head.filter((line) => line !== fieldLine).map(lineText)[0] ?? '';
            const [before, after] = splitAt(rest, ' - ');
            const hasDash = rest.includes(' - ');
            return {
                degree: hasDash || !field ? before : '',
                institution: hasDash ? after : field ? before : '',
                field,
                ...years,
                description,
            };
        }),
    skills: readTags,
    languages: readLanguages,
    interests: readTags,
} satisfies SectionReaders;
