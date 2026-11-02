import type { AppLang } from '@/lib/app-lang';

interface PDFStrings {
    workExperience: string;
    professionalExperience: string;
    education: string;
    techStack: string;
    coreCompetencies: string;
    skills: string;
    languages: string;
    interests: string;
    specialInterests: string;
    present: string;
    native: string;
    gdprConsent: (company: string) => string;
    gdprConsentGeneric: string;
}

const strings: Record<AppLang, PDFStrings> = {
    en: {
        workExperience: 'Work Experience',
        professionalExperience: 'Professional Experience',
        education: 'Education',
        techStack: 'Tech Stack',
        coreCompetencies: 'Core Competencies',
        skills: 'Skills',
        languages: 'Languages',
        interests: 'Interests',
        specialInterests: 'Special Interests',
        present: 'Present',
        native: 'Native',
        gdprConsent: (company) =>
            `I hereby give my consent for my personal data included in my CV to be processed for the purposes of the recruitment process conducted by ${company} in accordance with Regulation (EU) 2016/679 (GDPR).`,
        gdprConsentGeneric:
            'I hereby give my consent for my personal data included in my CV to be processed for the purposes of the recruitment process in accordance with Regulation (EU) 2016/679 (GDPR).',
    },
    pl: {
        workExperience: 'Doświadczenie zawodowe',
        professionalExperience: 'Doświadczenie zawodowe',
        education: 'Wykształcenie',
        techStack: 'Technologie',
        coreCompetencies: 'Kluczowe kompetencje',
        skills: 'Umiejętności',
        languages: 'Języki',
        interests: 'Zainteresowania',
        specialInterests: 'Zainteresowania',
        present: 'Obecnie',
        native: 'Natywny',
        gdprConsent: (company) =>
            `Wyrażam zgodę na przetwarzanie moich danych osobowych zawartych w moim CV dla potrzeb niezbędnych do realizacji procesu rekrutacji prowadzonego przez ${company} zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO).`,
        gdprConsentGeneric:
            'Wyrażam zgodę na przetwarzanie moich danych osobowych zawartych w moim CV dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO).',
    },
};

export function getPDFStrings(lang: AppLang): PDFStrings {
    return strings[lang] ?? strings.en;
}
