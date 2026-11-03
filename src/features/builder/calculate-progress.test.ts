import { describe, expect, it } from 'vitest';

import { calculateProgress } from '@/features/builder/calculate-progress';
import {
    EMPTY_EDUCATION,
    EMPTY_EXPERIENCE,
    EMPTY_LANGUAGE,
    EMPTY_PERSONAL_INFO,
    EMPTY_RESUME,
} from '@/features/resume/stored-resume';

describe('calculateProgress', () => {
    it('should be 0 when the resume is empty', () => {
        expect(calculateProgress(EMPTY_RESUME)).toBe(0);
    });

    it('should give 10 per required field when they are filled', () => {
        const personalInfo = { ...EMPTY_PERSONAL_INFO, firstName: 'Ada', lastName: 'L' };
        expect(calculateProgress({ ...EMPTY_RESUME, personalInfo })).toBe(20);
        expect(
            calculateProgress({
                ...EMPTY_RESUME,
                personalInfo: { ...personalInfo, email: 'a@b.co' },
            }),
        ).toBe(30);
    });

    it('should weight each list when it has an item', () => {
        expect(calculateProgress({ ...EMPTY_RESUME, experiences: [EMPTY_EXPERIENCE] })).toBe(25);
        expect(calculateProgress({ ...EMPTY_RESUME, education: [EMPTY_EDUCATION] })).toBe(20);
        expect(calculateProgress({ ...EMPTY_RESUME, skills: [{ name: 'Go' }] })).toBe(15);
        expect(calculateProgress({ ...EMPTY_RESUME, languages: [EMPTY_LANGUAGE] })).toBe(5);
        expect(calculateProgress({ ...EMPTY_RESUME, interests: [{ name: 'Chess' }] })).toBe(5);
    });

    it('should reach 100 when every part is filled', () => {
        expect(
            calculateProgress({
                ...EMPTY_RESUME,
                personalInfo: {
                    ...EMPTY_PERSONAL_INFO,
                    firstName: 'Ada',
                    lastName: 'L',
                    email: 'a@b.co',
                },
                experiences: [EMPTY_EXPERIENCE],
                education: [EMPTY_EDUCATION],
                skills: [{ name: 'Go' }],
                languages: [EMPTY_LANGUAGE],
                interests: [{ name: 'Chess' }],
            }),
        ).toBe(100);
    });
});
