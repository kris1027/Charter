import {
    readDateRange,
    readLevel,
    readMonthYear,
    readYearRange,
} from '@/features/pdf/import/readers/dates';

describe('readMonthYear', () => {
    it.each([
        ['March 2022', 'en', '2022-03'],
        ['mar 2022', 'en', '2022-03'],
        ['Sep. 2020', 'en', '2020-09'],
        ['styczeń 2024', 'pl', '2024-01'],
        ['sty 2024', 'pl', '2024-01'],
        ['PAŹ 2014', 'pl', '2014-10'],
    ] as const)(
        'should read %s in %s as %s when it is a month and year',
        (text, lang, expected) => {
            expect(readMonthYear(text, lang)).toBe(expected);
        },
    );

    it('should return null when the text is not a month and year', () => {
        expect(readMonthYear('Company 1', 'en')).toBeNull();
        expect(readMonthYear('sty 2024', 'en')).toBeNull();
    });
});

describe('readDateRange', () => {
    it('should set current when the end is the present word of the language', () => {
        expect(readDateRange('luty 2011 - Obecnie', 'pl')).toEqual({
            startDate: '2011-02',
            endDate: '',
            current: true,
        });
    });

    it('should read both ends when the range is closed', () => {
        expect(readDateRange('Mar 2012 - Dec 2013', 'en')).toEqual({
            startDate: '2012-03',
            endDate: '2013-12',
            current: false,
        });
    });

    it('should return null when either side is not a date', () => {
        expect(readDateRange('Company - Position', 'en')).toBeNull();
        expect(readDateRange('-', 'en')).toBeNull();
    });
});

describe('readYearRange', () => {
    it('should read each year as its first month when only years are printed', () => {
        expect(readYearRange('2010 - 2014')).toEqual({ startDate: '2010-01', endDate: '2014-01' });
        expect(readYearRange('- 2014')).toEqual({ startDate: '', endDate: '2014-01' });
    });

    it('should return null when the line is not a year range', () => {
        expect(readYearRange('Thesis on topic 1')).toBeNull();
    });
});

describe('readLevel', () => {
    it.each([
        ['C1', 'en', 'C1'],
        ['b2', 'en', 'B2'],
        ['Native', 'en', 'NATIVE'],
        ['Ojczysty', 'pl', 'NATIVE'],
        ['NATIVE', 'pl', 'NATIVE'],
    ] as const)('should read %s in %s as %s when it is a level', (text, lang, expected) => {
        expect(readLevel(text, lang)).toBe(expected);
    });

    it('should return null when the text is not a level', () => {
        expect(readLevel('Fluent', 'en')).toBeNull();
    });
});
