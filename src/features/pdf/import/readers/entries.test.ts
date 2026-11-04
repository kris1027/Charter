import {
    readDateLine,
    readDegreeField,
    readTimeline,
    readYearsLast,
} from '@/features/pdf/import/readers/entries';
import { lineText } from '@/features/pdf/import/text-lines';
import { line } from '@/test/pdf-lines';

describe('readDateLine', () => {
    it('should read the location after the first bar when the date line has one', () => {
        expect(readDateLine(line('May 2014 - Present | City | 4'), 'en')).toEqual({
            startDate: '2014-05',
            endDate: '',
            current: true,
            location: 'City | 4',
        });
    });

    it('should ignore a line when it is a bullet that happens to hold a range', () => {
        expect(readDateLine(line('• May 2014 - June 2015'), 'en')).toBeNull();
    });
});

describe('readTimeline', () => {
    it('should give each entry its head and bullets when several date lines follow each other', () => {
        const entries = readTimeline(
            [
                line('Company 1 | Position 1'),
                line('May 2014 - Present'),
                line('• Did things'),
                line('Company 2 | Position 2'),
                line('Jan 2010 - Feb 2012'),
            ],
            (l) => readDateLine(l, 'en'),
        );
        expect(entries.map((e) => [e.head.map(lineText), e.description])).toEqual([
            [['Company 1 | Position 1'], '• Did things'],
            [['Company 2 | Position 2'], ''],
        ]);
    });
});

describe('readYearsLast', () => {
    it('should give a larger line to the next entry when it sits right above the head of that entry', () => {
        const entries = readYearsLast([
            line('Degree 5 - University 5'),
            line('2010 - 2014'),
            line('Thesis on topic 5'),
            line('Field 6', { size: 10 }),
            line('University 6'),
            line('2011 - 2015'),
        ]);
        expect(entries.map((e) => [e.head.map(lineText), e.description])).toEqual([
            [['Degree 5 - University 5'], 'Thesis on topic 5'],
            [['Field 6', 'University 6'], ''],
        ]);
    });
});

describe('readDegreeField', () => {
    it('should split at the first in when the text holds several and keep a lone value as the degree', () => {
        expect(readDegreeField('MSc in Data in Health')).toEqual({
            degree: 'MSc',
            field: 'Data in Health',
        });
        expect(readDegreeField('Field 6')).toEqual({ degree: 'Field 6', field: '' });
    });
});
