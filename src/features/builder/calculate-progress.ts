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

// What each list adds to the percent once it holds an item; personal info adds the other 30
const LIST_WEIGHTS: { id: BuilderSectionId; weight: number }[] = [
    { id: 'experiences', weight: 25 },
    { id: 'education', weight: 20 },
    { id: 'skills', weight: 15 },
    { id: 'languages', weight: 5 },
    { id: 'interests', weight: 5 },
];

// Percent of the resume filled in
export const calculateProgress = (values: ResumeFormValues) => {
    const { firstName, lastName, email } = values.personalInfo;
    // Personal info (30%), one field at a time
    const personal = [firstName, lastName, email].filter(Boolean).length * 10;
    const lists = LIST_WEIGHTS.filter(({ id }) => isSectionComplete(id, values)).reduce(
        (sum, { weight }) => sum + weight,
        0,
    );

    return Math.min(personal + lists, 100);
};
