import type { AppLang } from '@/lib/app-lang';
import type { DateRange } from '@/features/pdf/import/readers/dates';
import { readDateRange, readYearRange } from '@/features/pdf/import/readers/dates';
import { isBullet, lineSize, readBullets, splitAt } from '@/features/pdf/import/readers/shared';
import { lineText } from '@/features/pdf/import/text-lines';
import type { TextLine } from '@/features/pdf/import/text-lines';

// The experience date line `start - end[ | location]` that developer and veterinary print.
export const readDateLine = (
    line: TextLine,
    lang: AppLang,
): (DateRange & { location: string }) | null => {
    if (isBullet(line)) return null;
    const [dates, location] = splitAt(lineText(line), '|');
    const range = readDateRange(dates, lang);
    return range && { ...range, location };
};

export type TimelineEntry<T> = {
    head: TextLine[];
    dateLine: TextLine;
    dates: T;
    description: string;
};

/**
 * Experience entries anchored on their date line: the lines between the previous entry's
 * bullets and the date line are the entry's head, the bullets after it its description.
 */
export function readTimeline<T>(
    lines: readonly TextLine[],
    readDates: (line: TextLine) => T | null,
): TimelineEntry<T>[] {
    const entries: TimelineEntry<T>[] = [];
    let i = 0;
    while (i < lines.length) {
        let dateAt = i;
        let dates: T | null = null;
        for (; dateAt < lines.length; dateAt++) {
            dates = readDates(lines[dateAt]);
            if (dates) break;
        }
        if (!dates) break;
        const { bullets, end } = readBullets(lines, dateAt + 1);
        entries.push({
            head: lines.slice(i, dateAt),
            dateLine: lines[dateAt],
            dates,
            description: bullets.join('\n'),
        });
        i = end;
    }
    return entries;
}

export type YearsEntry = {
    head: TextLine[];
    yearsLine: TextLine;
    years: { startDate: string; endDate: string };
    description: string;
};

const years = (line: TextLine) => readYearRange(lineText(line));

/**
 * Education entries that print their lines, then the years line, then the description
 * (developer, veterinary). An entry's head is the line before the years plus, when it is
 * printed larger than the years, the one before that; whatever sits between the previous
 * years line and the head is that entry's description.
 */
export function readYearsLast(lines: readonly TextLine[]): YearsEntry[] {
    const yearsAt = lines.flatMap((line, i) => (years(line) ? [i] : []));
    const starts = yearsAt.map((y, k) => {
        const floor = k > 0 ? yearsAt[k - 1] + 1 : 0;
        const size = lineSize(lines[y]);
        let start = y;
        if (start - 1 >= floor) start--;
        if (
            start - 1 >= floor &&
            lineSize(lines[start]) <= size &&
            lineSize(lines[start - 1]) > size
        )
            start--;
        return start;
    });
    return yearsAt.map((y, k) => ({
        head: lines.slice(starts[k], y),
        yearsLine: lines[y],
        years: years(lines[y]) ?? { startDate: '', endDate: '' },
        description: lines
            .slice(y + 1, starts[k + 1] ?? lines.length)
            .map(lineText)
            .join('\n'),
    }));
}

// `Degree in Field` split at the first ` in `; a lone value is the degree.
export const readDegreeField = (text: string) => {
    const [degree, field] = splitAt(text, ' in ');
    return { degree, field };
};
