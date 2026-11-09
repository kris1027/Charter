import { safeStorage } from '@/lib/storage';
import type {
    EducationProps,
    ExperienceProps,
    GdprConsentProps,
    LanguageProps,
    PersonalInfoProps,
    ResumeData,
    ResumeFormValues,
} from '@/features/resume/form-types';

export const EMPTY_PERSONAL_INFO: PersonalInfoProps = {
    firstName: '',
    lastName: '',
    location: '',
    title: '',
    phone: '',
    email: '',
    website: '',
    linkedin: '',
    github: '',
};

export const EMPTY_GDPR_CONSENT: GdprConsentProps = { enabled: false, companyName: '' };

// New list items start from these; always add a copy, never the constant itself
export const EMPTY_EXPERIENCE: ExperienceProps = {
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
};

export const EMPTY_EDUCATION: EducationProps = {
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    description: '',
};

export const EMPTY_LANGUAGE: LanguageProps = { language: '', proficiency: 'A1' };

export const EMPTY_RESUME: ResumeFormValues = {
    templateId: 'developer',
    personalInfo: EMPTY_PERSONAL_INFO,
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    interests: [],
    gdprConsent: EMPTY_GDPR_CONSENT,
};

export type StoredResume = Required<ResumeData> & { templateId?: string };

// Backfill keys missing from older saves or partial PDF imports
export const normalizeResume = (data: Partial<StoredResume>): StoredResume => ({
    templateId: data.templateId,
    personalInfo: { ...EMPTY_PERSONAL_INFO, ...data.personalInfo },
    experiences: data.experiences ?? [],
    education: data.education ?? [],
    skills: data.skills ?? [],
    languages: data.languages ?? [],
    interests: data.interests ?? [],
    gdprConsent: { ...EMPTY_GDPR_CONSENT, ...data.gdprConsent },
});

export const loadStoredResume = (): StoredResume | null => {
    const storedData = safeStorage.getItem('resumeData');
    if (!storedData) return null;
    try {
        return normalizeResume(JSON.parse(storedData));
    } catch {
        if (import.meta.env.DEV) console.warn('Failed to parse stored resume data');
        return null;
    }
};

// The stored resume as written, so a caller can tell whether saving would change anything
export const readStoredResumeJson = () => safeStorage.getItem('resumeData') ?? '';

export const readLastSaved = (): Date | null => {
    const stored = safeStorage.getItem('resumeData_lastSaved');
    if (!stored) return null;
    const date = new Date(stored);
    return Number.isNaN(date.getTime()) ? null : date;
};

// The only writers of the resume storage keys. A PDF import writes resumeData alone (no
// saved time), so a reload shows the import without it counting as a save.
export const writeResume = (values: ResumeFormValues) =>
    safeStorage.setItem('resumeData', JSON.stringify(values));

export const saveResume = (values: ResumeFormValues, { backup = false } = {}) => {
    const json = JSON.stringify(values);
    const ok = safeStorage.setItem('resumeData', json);
    if (backup) safeStorage.setItem('resumeData_backup', json);
    const savedAt = new Date();
    safeStorage.setItem('resumeData_lastSaved', savedAt.toISOString());
    return { ok, json, savedAt };
};

// Keeps resumeData_backup so a reset can be recovered from
export const clearResume = () => {
    safeStorage.removeItem('resumeData');
    safeStorage.removeItem('resumeData_lastSaved');
};
