import perfResume from '@/test/fixtures/perf-resume.json';
import { resumeFormSchema } from '@/features/resume/resume-schema';
import { sampleResumeData } from '@/features/resume/sample-resume-data';
import { normalizeResume } from '@/features/resume/stored-resume';
import type { StoredResume } from '@/features/resume/stored-resume';

// The Lighthouse seed script (scripts/perf/lhci-seed.cjs) stores this fixture as resumeData
describe('perf-resume fixture', () => {
    it('should equal the EN sample resume when the sample is unchanged', () => {
        expect(perfResume).toEqual(JSON.parse(JSON.stringify(sampleResumeData)));
    });

    it('should parse with the resume schema when loaded the way the app loads it', () => {
        // JSON imports widen enums to string, so the schema is the real check here.
        // No templateId on purpose: the template comes from the URL
        const result = resumeFormSchema
            .omit({ templateId: true })
            .safeParse(normalizeResume(perfResume as Partial<StoredResume>));

        expect(result.success).toBe(true);
    });
});
