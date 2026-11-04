import { detectLayout } from '@/features/pdf/import/detect-layout';
import { lines } from '@/test/pdf-lines';

const polishPage = (headers: string[]) =>
    lines(
        'Anna Kowalska',
        headers[0],
        'TechPol | Senior Developer',
        headers[1],
        'Informatyka',
        headers[2],
        'TypeScript',
        headers[3],
        'Polski Ojczysty',
        headers[4],
        'Szachy',
    );

describe('detectLayout', () => {
    it.each([
        ['// WORK EXPERIENCE', 'developer'],
        ['// TECH STACK', 'developer'],
        ['PROFESSIONAL EXPERIENCE', 'default'],
        ['CORE COMPETENCIES', 'default'],
        ['SPECIAL INTERESTS', 'veterinary'],
    ] as const)('should detect %s as %s when that header is printed', (header, templateId) => {
        expect(detectLayout(lines('Name', header))).toMatchObject({ templateId, lang: 'en' });
    });

    it('should return null when no section header is printed', () => {
        expect(detectLayout(lines('Just some random text'))).toBeNull();
    });

    it('should detect each template when the export is in Polish', () => {
        expect(
            detectLayout(
                polishPage([
                    '// DOŚWIADCZENIE ZAWODOWE',
                    '// WYKSZTAŁCENIE',
                    '// TECHNOLOGIE',
                    '// JĘZYKI',
                    '// ZAINTERESOWANIA',
                ]),
            ),
        ).toEqual({ templateId: 'developer', lang: 'pl', headerHits: 5 });
        expect(
            detectLayout(
                polishPage([
                    'DOŚWIADCZENIE ZAWODOWE',
                    'WYKSZTAŁCENIE',
                    'KLUCZOWE KOMPETENCJE',
                    'JĘZYKI',
                    'ZAINTERESOWANIA',
                ]),
            ),
        ).toEqual({ templateId: 'default', lang: 'pl', headerHits: 5 });
        expect(
            detectLayout(
                polishPage([
                    'Doświadczenie zawodowe',
                    'Wykształcenie',
                    'Umiejętności',
                    'Języki',
                    'ZAINTERESOWANIA',
                ]),
            ),
        ).toEqual({ templateId: 'veterinary', lang: 'pl', headerHits: 5 });
    });

    it('should detect veterinary when an older export prints its legacy headers', () => {
        const page = lines(
            'Anna',
            'Work Experience',
            'EDUCATION & TRAINING',
            'SKILLS',
            'LANGUAGES',
            'SPECIAL INTERESTS',
        );
        expect(detectLayout(page)).toEqual({ templateId: 'veterinary', lang: 'en', headerHits: 5 });
    });

    it('should prefer the first template and language when scores tie', () => {
        // ZAINTERESOWANIA alone is a default and a veterinary Polish header
        expect(detectLayout(lines('ZAINTERESOWANIA'))).toMatchObject({
            templateId: 'default',
            lang: 'pl',
            headerHits: 1,
        });
    });
});
