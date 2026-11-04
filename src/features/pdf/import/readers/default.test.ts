import { readers } from '@/features/pdf/import/readers/default';
import { line } from '@/test/pdf-lines';

describe('default readers', () => {
    it('should read the two column experience rows when the export is in Polish', () => {
        expect(
            readers.experience(
                [
                    line(['Position 4', 'maj 2014 - Obecnie']),
                    line(['Company 4', 'City 4']),
                    line(['•', 'Point']),
                    line(['Position 3', 'kwi 2013 - paź 2014']),
                    line('Company 3'),
                ],
                { lang: 'pl' },
            ),
        ).toEqual([
            {
                position: 'Position 4',
                company: 'Company 4',
                location: 'City 4',
                startDate: '2014-05',
                endDate: '',
                current: true,
                description: '• Point',
            },
            {
                position: 'Position 3',
                company: 'Company 3',
                location: '',
                startDate: '2013-04',
                endDate: '2014-10',
                current: false,
                description: '',
            },
        ]);
    });

    it('should read degree in field with years, then institution and description', () => {
        expect(
            readers.education([
                line(['MBA in Business Administration', '2018 - 2020']),
                line('Harvard'),
                line('Thesis'),
                line(['Field 6', '2011 - 2015']),
            ]),
        ).toEqual([
            {
                degree: 'MBA',
                field: 'Business Administration',
                institution: 'Harvard',
                startDate: '2018-01',
                endDate: '2020-01',
                description: 'Thesis',
            },
            {
                degree: 'Field 6',
                field: '',
                institution: '',
                startDate: '2011-01',
                endDate: '2015-01',
                description: '',
            },
        ]);
    });
});
