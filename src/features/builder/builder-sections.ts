// The form's sections in page order, named by their form value keys (spec 0012)
export const BUILDER_SECTION_IDS = [
    'personalInfo',
    'experiences',
    'education',
    'skills',
    'languages',
    'interests',
    'gdprConsent',
] as const;

export type BuilderSectionId = (typeof BUILDER_SECTION_IDS)[number];

// The id of a section element; the section strip links to it
export const sectionAnchor = (id: BuilderSectionId) => `section-${id}`;
