// Every resume section a template renders, in print order (spec 0006).
// Adding an id here fails the build until every layout titles it and every template renders it.
export const SECTION_IDS = ['experience', 'education', 'skills', 'languages', 'interests'] as const;

export type SectionId = (typeof SECTION_IDS)[number];
