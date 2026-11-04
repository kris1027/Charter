import { buildResumeMetadata } from '@/features/resume/resume-metadata';
import { resumeFromSource } from '@/features/pdf/import/load-resume';
import { lines } from '@/test/pdf-lines';
import type { ResumeData } from '@/features/resume/form-types';

const data: ResumeData = {
    personalInfo: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        location: '',
        title: '',
        phone: '',
        email: 'ada@x.co',
        website: '',
        linkedin: '',
        github: '',
    },
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    interests: [],
};

describe('resumeFromSource', () => {
    it('should return the embedded copy without reading the text when the metadata is valid', () => {
        const result = resumeFromSource({
            metadataCreator: buildResumeMetadata('default', data),
            lines: [],
            linkUrls: [],
        });
        expect(result).toEqual({
            ...data,
            templateId: 'default',
            gdprConsent: { enabled: false, companyName: '' },
        });
    });

    it('should fall back to the printed text when the metadata is not ours', () => {
        const result = resumeFromSource({
            metadataCreator: 'Microsoft Word',
            lines: lines('Ada Lovelace', '// TECH STACK', 'Go'),
            linkUrls: [],
        });
        expect(result.skills).toEqual([{ name: 'Go' }]);
    });
});
