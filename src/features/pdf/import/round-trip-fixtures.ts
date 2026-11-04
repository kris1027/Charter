import type { ResumeData } from '@/features/resume/form-types';
import { getPreviewFixture } from '@/features/templates/fixtures/preview-fixtures';

// The preview fixtures the round trip renders (spec 0007, AC-11). Their education years
// (`20${n}-10`) print as three digits, and changing them would break the preview baseline,
// so these copies use real four digit years instead.
export const ROUND_TRIP_FIXTURE_IDS = ['full', 'edges', 'long'] as const;

export type RoundTripFixtureId = (typeof ROUND_TRIP_FIXTURE_IDS)[number];

export const getRoundTripFixture = (fixtureId: RoundTripFixtureId): ResumeData => {
    // The three fixtures are the same for every template and language.
    const data = getPreviewFixture(fixtureId, 'developer', 'en');
    return {
        ...data,
        education: data.education.map((edu, i) => ({
            ...edu,
            startDate: `${2010 + i}-10`,
            endDate: `${2014 + i}-06`,
        })),
    };
};
