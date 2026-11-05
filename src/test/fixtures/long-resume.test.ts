import longResume from '@/test/fixtures/long-resume.json';
import { resumeFormSchema } from '@/features/resume/resume-schema';
import { normalizeResume } from '@/features/resume/stored-resume';
import type { StoredResume } from '@/features/resume/stored-resume';

// The long resume the builder responsiveness tests and profiles type into (spec 0009)
describe('long-resume fixture', () => {
    it('should parse with the resume schema when loaded the way the app loads it', () => {
        // JSON imports widen enums to string, so the schema is the real check here
        const result = resumeFormSchema
            .omit({ templateId: true })
            .safeParse(normalizeResume(longResume as Partial<StoredResume>));

        expect(result.success).toBe(true);
    });

    it('should hold the sizes the spec asks for when counted', () => {
        expect(longResume.experiences).toHaveLength(8);
        expect(longResume.education).toHaveLength(4);
        expect(longResume.skills).toHaveLength(30);
        expect(longResume.languages).toHaveLength(6);
        expect(longResume.interests).toHaveLength(12);
        expect(longResume.gdprConsent).toEqual({ enabled: true, companyName: 'Northwind Labs' });
        for (const experience of longResume.experiences) {
            expect(experience.description.length).toBeGreaterThan(1100);
        }
    });
});
