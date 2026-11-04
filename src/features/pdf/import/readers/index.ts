import type { ResumeFormValues } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';
import type { SectionId } from '@/features/templates/model/section-ids';
import type { TextLine } from '@/features/pdf/import/text-lines';
import { readers as developer } from '@/features/pdf/import/readers/developer';
import { readers as defaultReaders } from '@/features/pdf/import/readers/default';
import { readers as veterinary } from '@/features/pdf/import/readers/veterinary';

// The form field each section fills.
export const SECTION_FIELDS = {
    experience: 'experiences',
    education: 'education',
    skills: 'skills',
    languages: 'languages',
    interests: 'interests',
} as const satisfies Record<SectionId, keyof ResumeFormValues>;

type SectionFields = typeof SECTION_FIELDS;

export type ReaderCtx = { lang: AppLang };

// One reader per section, so a new SectionId fails the build until every template reads it.
export type SectionReaders = {
    [K in SectionId]: (lines: TextLine[], ctx: ReaderCtx) => ResumeFormValues[SectionFields[K]];
};

// A new TemplateId fails the build until it has readers.
export const SECTION_READERS = {
    developer,
    default: defaultReaders,
    veterinary,
} satisfies Record<TemplateId, SectionReaders>;
