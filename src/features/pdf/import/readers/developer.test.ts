import { readers } from '@/features/pdf/import/readers/developer';
import { line } from '@/test/pdf-lines';

const ctx = { lang: 'en' } as const;

describe('developer readers', () => {
    it('should read company, position, dates, location and bullets when the date line follows the company line', () => {
        expect(
            readers.experience(
                [
                    line('ACME Corp | Frontend Developer', { size: 11 }),
                    line('January 2023 - Present | Warsaw'),
                    line('• Built amazing features'),
                ],
                ctx,
            ),
        ).toEqual([
            {
                company: 'ACME Corp',
                position: 'Frontend Developer',
                location: 'Warsaw',
                startDate: '2023-01',
                endDate: '',
                current: true,
                description: '• Built amazing features',
            },
        ]);
    });

    it('should read field, degree and institution when all three print', () => {
        expect(
            readers.education([
                line('Computer Science', { size: 10 }),
                line('BSc - University of DSW Ideis in Cracow'),
                line('2019 - 2023'),
                line('Thesis'),
            ]),
        ).toEqual([
            {
                field: 'Computer Science',
                degree: 'BSc',
                institution: 'University of DSW Ideis in Cracow',
                startDate: '2019-01',
                endDate: '2023-01',
                description: 'Thesis',
            },
        ]);
    });

    it('should read a line without a dash as the institution when a field prints, else the degree', () => {
        const [withField, withoutField] = [
            readers.education([line('CS', { size: 10 }), line('MIT'), line('2019 - 2023')]),
            readers.education([line('BSc'), line('2019 - 2023')]),
        ];
        expect(withField[0]).toMatchObject({ field: 'CS', institution: 'MIT', degree: '' });
        expect(withoutField[0]).toMatchObject({ field: '', institution: '', degree: 'BSc' });
    });
});
