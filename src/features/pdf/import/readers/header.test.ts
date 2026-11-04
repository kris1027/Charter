import { readHeader } from '@/features/pdf/import/readers/header';
import { line } from '@/test/pdf-lines';

const developerHeader = (title = true) => [
    line(['Anna Kowalska'], { size: 24 }),
    ...(title ? [line('Staff Engineer', { size: 13 })] : []),
    line(['anna.dev', 'annak', 'anna-kowalska']),
    line(['Kraków, Poland', 'anna@example.com', '+48 600 100 200']),
];

describe('readHeader', () => {
    it('should read every field from the printed cells and the link annotations', () => {
        expect(
            readHeader(developerHeader(), {
                templateId: 'developer',
                linkUrls: [
                    'https://anna.dev/',
                    'https://github.com/annak',
                    'https://www.linkedin.com/in/anna-kowalska/',
                    'mailto:anna@example.com',
                ],
            }),
        ).toEqual({
            firstName: 'Anna',
            lastName: 'Kowalska',
            title: 'Staff Engineer',
            location: 'Kraków, Poland',
            email: 'anna@example.com',
            phone: '+48 600 100 200',
            website: 'https://anna.dev/',
            github: 'https://github.com/annak',
            linkedin: 'https://www.linkedin.com/in/anna-kowalska/',
        });
    });

    it('should rebuild links from the printed text in contact row order when there are no annotations', () => {
        expect(
            readHeader(developerHeader(false), { templateId: 'developer', linkUrls: [] }),
        ).toEqual({
            firstName: 'Anna',
            lastName: 'Kowalska',
            title: '',
            location: 'Kraków, Poland',
            email: 'anna@example.com',
            phone: '+48 600 100 200',
            website: 'https://anna.dev',
            github: 'https://github.com/annak',
            linkedin: 'https://linkedin.com/in/anna-kowalska',
        });
    });

    it('should take the one cell left as the location when the links are annotated', () => {
        const header = [
            line('Jan Maria Nowak', { size: 22 }),
            line(['Warsaw', 'jan@x.pl', 'https://jan.pl']),
        ];
        expect(
            readHeader(header, { templateId: 'default', linkUrls: ['https://jan.pl'] }),
        ).toMatchObject({
            firstName: 'Jan',
            lastName: 'Maria Nowak',
            location: 'Warsaw',
            website: 'https://jan.pl',
        });
    });

    it('should return empty fields when there is no header', () => {
        expect(readHeader([], { templateId: 'default', linkUrls: [] }).firstName).toBe('');
    });
});
