import type { ResumeFormValues } from '@/features/resume/form-types';

// Percent of the resume filled in; Preview unlocks at 30 (the three required fields)
export const calculateProgress = (values: ResumeFormValues) => {
    let progress = 0;

    // Personal info (30%)
    if (values.personalInfo.firstName) progress += 10;
    if (values.personalInfo.lastName) progress += 10;
    if (values.personalInfo.email) progress += 10;

    if (values.experiences.length > 0) progress += 25;
    if (values.education.length > 0) progress += 20;
    if (values.skills.length > 0) progress += 15;
    if (values.languages.length > 0) progress += 5;
    if (values.interests.length > 0) progress += 5;

    return Math.min(progress, 100);
};
