import type { LanguageLevelProps } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import { getMonthNames } from '@/lib/date-format';
import { getPDFStrings } from '@/features/templates/model/template-strings';

const normalizeMonth = (name: string) => name.toLocaleLowerCase().replace(/\.$/, '');

// Month name (long or short, any case, optional trailing dot) → month number 1..12.
const monthIndex = (name: string, lang: AppLang): number => {
    const wanted = normalizeMonth(name);
    for (const style of ['long', 'short'] as const) {
        const i = getMonthNames(style, lang).findIndex((m) => normalizeMonth(m) === wanted);
        if (i >= 0) return i + 1;
    }
    return 0;
};

// `March 2022`, `mar 2022`, `styczeń 2024`, `sty. 2024` → `YYYY-MM`; null when it is not one.
export function readMonthYear(text: string, lang: AppLang): string | null {
    const match = text.trim().match(/^(\S+)\s+(\d{4})$/u);
    if (!match) return null;
    const month = monthIndex(match[1], lang);
    return month ? `${match[2]}-${String(month).padStart(2, '0')}` : null;
}

export type DateRange = { startDate: string; endDate: string; current: boolean };

// `start - end` as experience prints it; an empty side reads as ''. Null when not a range.
export function readDateRange(text: string, lang: AppLang): DateRange | null {
    const match = text.trim().match(/^(.*?)\s*-\s*(.*)$/u);
    if (!match) return null;
    const [, start, end] = match;
    const startDate = start ? readMonthYear(start, lang) : '';
    if (startDate === null) return null;
    if (end === getPDFStrings(lang).present) return { startDate, endDate: '', current: true };
    const endDate = end ? readMonthYear(end, lang) : '';
    if (endDate === null || (!startDate && !endDate)) return null;
    return { startDate, endDate, current: false };
}

// `2010 - 2014` as education prints it (either side may be empty) → `YYYY-01` each.
export function readYearRange(text: string): { startDate: string; endDate: string } | null {
    const match = text.trim().match(/^(\d{4})?\s*-\s*(\d{4})?$/u);
    if (!match) return null;
    const year = (y: string | undefined) => (y ? `${y}-01` : '');
    return { startDate: year(match[1]), endDate: year(match[2]) };
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

// A printed language level: A1 to C2, the language's native label, or the legacy `NATIVE`.
export function readLevel(text: string, lang: AppLang): LanguageLevelProps | null {
    const value = text.trim();
    const upper = value.toUpperCase();
    const level = LEVELS.find((l) => l === upper);
    if (level) return level;
    const native = getPDFStrings(lang).native.toLocaleLowerCase();
    return value.toLocaleLowerCase() === native || value === 'NATIVE' ? 'NATIVE' : null;
}
