import type { ResumeFormValues } from '@/features/resume/form-types';

// Percent of the resume filled in; Preview unlocks at PREVIEW_UNLOCK_PROGRESS
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

// The three required fields are worth 30 together
export const PREVIEW_UNLOCK_PROGRESS = 30;

// Gate for Preview CV and the live preview's Open preview button
export const canOpenPreview = (state: { canSubmit: boolean; values: ResumeFormValues }) =>
    state.canSubmit && calculateProgress(state.values) >= PREVIEW_UNLOCK_PROGRESS;
