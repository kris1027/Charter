import type { ResumeData } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';
import {
    sampleDefaultResumeData,
    sampleResumeData,
    sampleVeterinaryResumeData,
} from '@/features/resume/sample-resume-data';
import {
    sampleDefaultResumeDataPl,
    sampleResumeDataPl,
    sampleVeterinaryResumeDataPl,
} from '@/features/resume/sample-resume-data-pl';

// The sample resume each template shows, per language (detail page and preview images).
export const SAMPLE_RESUMES: Record<TemplateId, Record<AppLang, ResumeData>> = {
    developer: { en: sampleResumeData, pl: sampleResumeDataPl },
    default: { en: sampleDefaultResumeData, pl: sampleDefaultResumeDataPl },
    veterinary: { en: sampleVeterinaryResumeData, pl: sampleVeterinaryResumeDataPl },
};
