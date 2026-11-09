import { describe, expect, it } from 'vitest';

import {
    formatCVDate,
    formatCVDateShort,
    formatCVYear,
    formatTimeAgo,
    getMonthNames,
} from './date-format';

// Pinned against the date-fns 4.1.0 output these helpers replaced ('LLLL yyyy', 'LLL yyyy',
// 'LLLL', 'LLL' with the enUS and pl locales); all 48 strings checked on Node 24, 2026-10-21
const LONG = {
    en: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ],
    pl: [
        'styczeń',
        'luty',
        'marzec',
        'kwiecień',
        'maj',
        'czerwiec',
        'lipiec',
        'sierpień',
        'wrzesień',
        'październik',
        'listopad',
        'grudzień',
    ],
};

const SHORT = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    pl: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'],
};

const LANGS = ['en', 'pl'] as const;
const MONTHS = Array.from({ length: 12 }, (_, i) => `2024-${String(i + 1).padStart(2, '0')}`);

describe('date-format', () => {
    describe.each(LANGS)('in %s', (lang) => {
        it('should format the long month and year when given each of the 12 months', () => {
            expect(MONTHS.map((d) => formatCVDate(d, lang))).toEqual(
                LONG[lang].map((m) => `${m} 2024`),
            );
        });

        it('should format the short month and year when given each of the 12 months', () => {
            expect(MONTHS.map((d) => formatCVDateShort(d, lang))).toEqual(
                SHORT[lang].map((m) => `${m} 2024`),
            );
        });

        it('should list the long month names when asked for the long style', () => {
            expect(getMonthNames('long', lang)).toEqual(LONG[lang]);
        });

        it('should list the short month names when asked for the short style', () => {
            expect(getMonthNames('short', lang)).toEqual(SHORT[lang]);
        });
    });

    it('should return an empty string when the date is empty', () => {
        expect(formatCVDate('', 'en')).toBe('');
        expect(formatCVDateShort('', 'pl')).toBe('');
        expect(formatCVYear('')).toBe('');
    });

    it('should return the year when given a year and month', () => {
        expect(formatCVYear('2024-05')).toBe('2024');
    });
});

describe('formatTimeAgo', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    const ago = (ms: number) => new Date(now.getTime() - ms);
    const MINUTE = 60_000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    it('should return null when the date is under a minute old', () => {
        expect(formatTimeAgo(ago(30_000), 'en', now)).toBeNull();
    });

    it('should return null when the date is in the future', () => {
        expect(formatTimeAgo(ago(-HOUR), 'en', now)).toBeNull();
    });

    it('should use the singular when one minute has passed in English', () => {
        expect(formatTimeAgo(ago(MINUTE), 'en', now)).toBe('1 minute ago');
    });

    it('should use the right Polish plural when two minutes have passed', () => {
        expect(formatTimeAgo(ago(2 * MINUTE), 'pl', now)).toBe('2 minuty temu');
    });

    it('should count hours when the date is under a day old', () => {
        expect(formatTimeAgo(ago(3 * HOUR), 'en', now)).toBe('3 hours ago');
    });

    it('should count days when the date is under a week old', () => {
        expect(formatTimeAgo(ago(6 * DAY), 'en', now)).toBe('6 days ago');
    });

    it('should use a medium date when the date is a week old', () => {
        expect(formatTimeAgo(ago(7 * DAY), 'en', now)).toBe('Nov 2, 2026');
    });
});
