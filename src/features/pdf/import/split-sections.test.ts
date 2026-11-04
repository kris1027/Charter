import { getPDFStrings } from '@/features/templates/model/template-strings';
import { splitSections } from '@/features/pdf/import/split-sections';
import { lineText } from '@/features/pdf/import/text-lines';
import type { TextLine } from '@/features/pdf/import/text-lines';
import { lines } from '@/test/pdf-lines';

const texts = (slice: TextLine[] | undefined) => slice?.map(lineText);

// The clause wrapped onto two lines at a word boundary, as the templates print it.
const halves = (text: string) => {
    const words = text.split(' ');
    const half = Math.ceil(words.length / 2);
    return [words.slice(0, half).join(' '), words.slice(half).join(' ')];
};

describe('splitSections', () => {
    it('should give each section only its own lines when sections print out of order', () => {
        const page = lines('Jan Nowak', '// TECH STACK', 'Go', '// WORK EXPERIENCE', 'Job');
        const slices = splitSections(page, { templateId: 'developer', lang: 'en', headerHits: 2 });
        expect(texts(slices.header)).toEqual(['Jan Nowak']);
        expect(texts(slices.sections.skills)).toEqual(['Go']);
        expect(texts(slices.sections.experience)).toEqual(['Job']);
        expect(slices.sections.education).toBeUndefined();
    });

    it('should cut the GDPR clause into the footer when it follows the last section', () => {
        const page = lines(
            'Jan',
            '// INTERESTS',
            'Running',
            ...halves(getPDFStrings('en').gdprConsent('Acme')),
        );
        const slices = splitSections(page, { templateId: 'developer', lang: 'en', headerHits: 1 });
        expect(texts(slices.sections.interests)).toEqual(['Running']);
        expect(slices.footer).toHaveLength(2);
    });

    it('should keep a line that opens like the clause in its section when it is not the clause', () => {
        const page = lines(
            'Jan',
            '// EDUCATION',
            'Computer Science - University',
            'I hereby give talks on compilers',
            '// INTERESTS',
            'Running',
        );
        const slices = splitSections(page, { templateId: 'developer', lang: 'en', headerHits: 2 });
        expect(texts(slices.sections.education)).toEqual([
            'Computer Science - University',
            'I hereby give talks on compilers',
        ]);
        expect(texts(slices.sections.interests)).toEqual(['Running']);
        expect(slices.footer).toEqual([]);
    });

    it('should cut the Polish clause when the export is in Polish', () => {
        const clause = halves(getPDFStrings('pl').gdprConsentGeneric);
        const page = lines('Jan', 'JĘZYKI', 'Polski Ojczysty', ...clause);
        const slices = splitSections(page, { templateId: 'default', lang: 'pl', headerHits: 1 });
        expect(texts(slices.sections.languages)).toEqual(['Polski Ojczysty']);
        expect(texts(slices.footer)).toEqual(clause);
    });

    describe('older veterinary exports', () => {
        const vet = lines(
            'Anna Kowalska',
            'Work Experience',
            '• Research Interests: surgery',
            'EDUCATION & TRAINING',
            'Veterinary Medicine',
            'SKILLS',
            'Surgery',
            'Interests',
            'Animal welfare',
        );
        const slices = splitSections(vet, { templateId: 'veterinary', lang: 'en', headerHits: 4 });

        it('should find the education section when an old header only contains EDUCATION', () => {
            expect(texts(slices.sections.education)).toEqual(['Veterinary Medicine']);
            expect(texts(slices.sections.skills)).toEqual(['Surgery']);
        });

        it('should not treat a line containing Interests as the interests header', () => {
            expect(texts(slices.sections.experience)).toEqual(['• Research Interests: surgery']);
            expect(texts(slices.sections.interests)).toEqual(['Animal welfare']);
        });
    });
});
