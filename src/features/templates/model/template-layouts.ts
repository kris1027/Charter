import type { TemplateId } from '@/lib/template-ids';
import type { SectionId } from '@/features/templates/model/section-ids';
import { SECTION_IDS } from '@/features/templates/model/section-ids';
import type { PDFStrings } from '@/features/templates/model/template-strings';

export type ContactKind = 'location' | 'email' | 'phone' | 'linkedin' | 'website' | 'github';

// What differs between templates besides their look: titles, contact rows and value formats.
export type TemplateLayout = {
    sections: readonly SectionId[];
    titles: Record<SectionId, (s: PDFStrings) => string>;
    contactRows: readonly (readonly ContactKind[])[];
    dateStyle: 'long' | 'short';
    websiteDisplay: 'raw' | 'short';
};

const code = (title: string) => `// ${title.toUpperCase()}`;

export const TEMPLATE_LAYOUTS = {
    developer: {
        sections: SECTION_IDS,
        titles: {
            experience: (s) => code(s.workExperience),
            education: (s) => code(s.education),
            skills: (s) => code(s.techStack),
            languages: (s) => code(s.languages),
            interests: (s) => code(s.interests),
        },
        contactRows: [
            ['website', 'github', 'linkedin'],
            ['location', 'email', 'phone'],
        ],
        dateStyle: 'long',
        websiteDisplay: 'short',
    },
    default: {
        sections: SECTION_IDS,
        titles: {
            experience: (s) => s.professionalExperience.toUpperCase(),
            education: (s) => s.education.toUpperCase(),
            skills: (s) => s.coreCompetencies.toUpperCase(),
            languages: (s) => s.languages.toUpperCase(),
            interests: (s) => s.interests.toUpperCase(),
        },
        contactRows: [['location', 'email', 'phone', 'linkedin', 'website']],
        dateStyle: 'short',
        websiteDisplay: 'raw',
    },
    veterinary: {
        sections: SECTION_IDS,
        titles: {
            experience: (s) => s.workExperience,
            education: (s) => s.education,
            skills: (s) => s.skills,
            languages: (s) => s.languages,
            interests: (s) => s.specialInterests.toUpperCase(),
        },
        contactRows: [['location', 'email', 'phone', 'linkedin', 'website']],
        dateStyle: 'short',
        websiteDisplay: 'raw',
    },
} satisfies Record<TemplateId, TemplateLayout>;
