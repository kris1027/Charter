import { PdfImportError } from '@/features/pdf/import/pdf-import-error';
import { readResumeFromText } from '@/features/pdf/import/read-resume-text';
import { line, lines } from '@/test/pdf-lines';

describe('readResumeFromText', () => {
    it('should throw an unrecognized import error when no section header prints', () => {
        expect(() => readResumeFromText(lines('Just some random text'))).toThrow(PdfImportError);
        expect(() => readResumeFromText([])).toThrow(
            expect.objectContaining({ code: 'unrecognized' }),
        );
    });

    it('should read every section in the detected language when the template is recognized', () => {
        const result = readResumeFromText([
            line('Jan Nowak', { size: 24 }),
            line('jan@example.com'),
            line('// TECHNOLOGIE', { size: 11 }),
            line(['React Native', 'Go']),
            line('// JĘZYKI', { size: 11 }),
            line(['Polski', 'Ojczysty']),
        ]);
        expect(result).toMatchObject({
            templateId: 'developer',
            personalInfo: { firstName: 'Jan', lastName: 'Nowak', email: 'jan@example.com' },
            skills: [{ name: 'React Native' }, { name: 'Go' }],
            languages: [{ language: 'Polski', proficiency: 'NATIVE' }],
            experiences: [],
            gdprConsent: { enabled: false, companyName: '' },
        });
    });
});
