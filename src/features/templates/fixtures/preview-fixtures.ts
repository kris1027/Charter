import type { ExperienceProps, EducationProps, ResumeData } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';
import { SAMPLE_RESUMES } from '@/features/resume/sample-resumes';

// Resumes the pixel diff in scripts/templates/build-previews.ts renders (spec 0006, AC-3).
// Each one covers a branch the templates draw differently, so a refactor that changes the look fails.

export const FIXTURE_IDS = ['sample', 'full', 'minimal', 'edges', 'long'] as const;

export type FixtureId = (typeof FIXTURE_IDS)[number];

const experience = (n: number, current = false): ExperienceProps => ({
    company: `Company ${n}`,
    position: `Position ${n}`,
    location: `City ${n}`,
    startDate: `20${10 + n}-0${(n % 9) + 1}`,
    endDate: current ? '' : `20${11 + n}-1${n % 3}`,
    current,
    description: `• Built feature ${n} that spans a long line of text so the bullet wraps onto a second line in every template
- Second point for role ${n}
  * Third point with a different marker

• Fourth point after an empty line`,
});

const education = (n: number): EducationProps => ({
    institution: `University ${n}`,
    degree: `Degree ${n}`,
    field: `Field ${n}`,
    startDate: `20${n}-10`,
    endDate: `20${n + 4}-06`,
    description: `Thesis on topic ${n}`,
});

const full: ResumeData = {
    personalInfo: {
        firstName: 'Anna',
        lastName: 'Kowalska',
        location: 'Kraków, Poland',
        title: 'Staff Engineer',
        phone: '+48 600 100 200',
        email: 'anna@example.com',
        website: 'https://anna.dev/',
        linkedin: 'https://www.linkedin.com/in/anna-kowalska/',
        github: 'https://github.com/annak',
    },
    experiences: [experience(1, true), experience(2)],
    education: [education(1)],
    skills: [{ name: 'TypeScript' }, { name: 'React' }, { name: 'Node.js' }],
    languages: [
        { language: 'Polish', proficiency: 'NATIVE' },
        { language: 'English', proficiency: 'C1' },
    ],
    interests: [{ name: 'Climbing' }, { name: 'Chess' }],
    gdprConsent: { enabled: true, companyName: 'ACME Corp' },
};

const minimal: ResumeData = {
    personalInfo: {
        firstName: 'Jan',
        lastName: 'Nowak',
        location: '',
        title: '',
        phone: '',
        email: 'jan@example.com',
        website: '',
        linkedin: '',
        github: '',
    },
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    interests: [],
    gdprConsent: { enabled: false, companyName: '' },
};

const edges: ResumeData = {
    personalInfo: { ...full.personalInfo, title: '', website: 'anna.dev' },
    experiences: [
        { ...experience(3), location: '' },
        { ...experience(4), current: true, endDate: '2020-01' },
    ],
    education: [
        { ...education(5), field: '' },
        { ...education(6), degree: '' },
    ],
    skills: [],
    languages: full.languages,
    interests: full.interests,
    gdprConsent: { enabled: true, companyName: '' },
};

const long: ResumeData = {
    ...full,
    experiences: Array.from({ length: 7 }, (_, i) => experience(i + 1, i === 0)),
    education: Array.from({ length: 4 }, (_, i) => education(i + 1)),
};

export const getPreviewFixture = (
    fixtureId: FixtureId,
    templateId: TemplateId,
    lang: AppLang,
): ResumeData => {
    switch (fixtureId) {
        case 'sample':
            return SAMPLE_RESUMES[templateId][lang];
        case 'full':
            return full;
        case 'minimal':
            return minimal;
        case 'edges':
            return edges;
        case 'long':
            return long;
    }
};
