import { splitSections } from '@/features/pdf/import/split-sections';
import { lineText } from '@/features/pdf/import/text-lines';
import type { TextLine } from '@/features/pdf/import/text-lines';
import { lines } from '@/test/pdf-lines';

const texts = (slice: TextLine[] | undefined) => slice?.map(lineText);

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
            'I hereby give my consent for my personal data to be processed',
            'in accordance with Regulation (EU) 2016/679 (GDPR).',
        );
        const slices = splitSections(page, { templateId: 'developer', lang: 'en', headerHits: 1 });
        expect(texts(slices.sections.interests)).toEqual(['Running']);
        expect(slices.footer).toHaveLength(2);
    });

    it('should cut the Polish clause when the export is in Polish', () => {
        const page = lines('Jan', 'JĘZYKI', 'Polski Ojczysty', 'Wyrażam zgodę na przetwarzanie');
        const slices = splitSections(page, { templateId: 'default', lang: 'pl', headerHits: 1 });
        expect(texts(slices.sections.languages)).toEqual(['Polski Ojczysty']);
        expect(texts(slices.footer)).toEqual(['Wyrażam zgodę na przetwarzanie']);
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
