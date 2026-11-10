import type { BuilderSectionId } from '@/features/builder/builder-sections';
import type { ResumeFormValues } from '@/features/resume/form-types';

// Whether the section strip shows a check (spec 0012, AC-13). Filled means any non empty string,
// and a list counts once it holds any item, even a blank card, the same as the percent below
export const isSectionComplete = (id: BuilderSectionId, values: ResumeFormValues): boolean => {
    switch (id) {
        case 'personalInfo': {
            const { firstName, lastName, email } = values.personalInfo;
            return Boolean(firstName && lastName && email);
        }
        case 'gdprConsent':
            return false;
        default:
            return values[id].length > 0;
    }
};

// Percent of the resume filled in
export const calculateProgress = (values: ResumeFormValues) => {
    let progress = 0;

    // Personal info (30%), one field at a time
    if (values.personalInfo.firstName) progress += 10;
    if (values.personalInfo.lastName) progress += 10;
    if (values.personalInfo.email) progress += 10;

    if (isSectionComplete('experiences', values)) progress += 25;
    if (isSectionComplete('education', values)) progress += 20;
    if (isSectionComplete('skills', values)) progress += 15;
    if (isSectionComplete('languages', values)) progress += 5;
    if (isSectionComplete('interests', values)) progress += 5;

    return Math.min(progress, 100);
};
