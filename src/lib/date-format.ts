import type { AppLang } from '@/lib/app-lang';

export type MonthStyle = 'long' | 'short';

const localeTags: Record<AppLang, string> = {
    en: 'en-US',
    pl: 'pl-PL',
};

const dateFormats = {
    monthYearLong: { month: 'long', year: 'numeric' },
    monthYearShort: { month: 'short', year: 'numeric' },
    monthLong: { month: 'long' },
    monthShort: { month: 'short' },
    dateMedium: { dateStyle: 'medium' },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

type DateFormat = keyof typeof dateFormats;

const formatters = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (lang: AppLang, format: DateFormat) => {
    const key = `${lang}-${format}`;
    let formatter = formatters.get(key);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat(localeTags[lang], dateFormats[format]);
        formatters.set(key, formatter);
    }
    return formatter;
};

const formatMonthYear = (dateString: string, format: DateFormat, lang: AppLang): string => {
    if (!dateString) return '';
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return getFormatter(lang, format).format(date);
};

export const formatCVDate = (dateString: string, lang: AppLang): string =>
    formatMonthYear(dateString, 'monthYearLong', lang);

export const formatCVDateShort = (dateString: string, lang: AppLang): string =>
    formatMonthYear(dateString, 'monthYearShort', lang);

export const formatCVYear = (dateString: string): string => {
    if (!dateString) return '';
    const [year] = dateString.split('-');
    return year;
};

export const getMonthNames = (style: MonthStyle, lang: AppLang): string[] => {
    const formatter = getFormatter(lang, style === 'long' ? 'monthLong' : 'monthShort');
    return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(2024, i)));
};

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

// Null means "just now" (under a minute, or a clock that ran ahead), so the caller picks the copy
export const formatTimeAgo = (date: Date, lang: AppLang, now = new Date()): string | null => {
    const elapsed = now.getTime() - date.getTime();
    if (elapsed < MINUTE_MS) return null;
    if (elapsed >= WEEK_MS) return getFormatter(lang, 'dateMedium').format(date);

    const relative = new Intl.RelativeTimeFormat(localeTags[lang], { numeric: 'always' });
    if (elapsed < HOUR_MS) return relative.format(-Math.floor(elapsed / MINUTE_MS), 'minute');
    if (elapsed < DAY_MS) return relative.format(-Math.floor(elapsed / HOUR_MS), 'hour');
    return relative.format(-Math.floor(elapsed / DAY_MS), 'day');
};
