import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    clearResume,
    EMPTY_GDPR_CONSENT,
    EMPTY_PERSONAL_INFO,
    EMPTY_RESUME,
    loadStoredResume,
    saveResume,
    writeResume,
} from './stored-resume';

describe('loadStoredResume', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should return null when nothing is stored', () => {
        expect(loadStoredResume()).toBeNull();
    });

    it('should return null when the stored data is not valid JSON', () => {
        localStorage.setItem('resumeData', '{not json');
        expect(loadStoredResume()).toBeNull();
    });

    it('should backfill missing keys when the save is from an older version', () => {
        localStorage.setItem(
            'resumeData',
            JSON.stringify({ templateId: 'default', personalInfo: { firstName: 'Ada' } }),
        );

        expect(loadStoredResume()).toEqual({
            templateId: 'default',
            personalInfo: { ...EMPTY_PERSONAL_INFO, firstName: 'Ada' },
            experiences: [],
            education: [],
            skills: [],
            languages: [],
            interests: [],
            gdprConsent: EMPTY_GDPR_CONSENT,
        });
    });
});

describe('saveResume', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should write the resume and saved time but no backup when backup is not asked', () => {
        const result = saveResume(EMPTY_RESUME);

        expect(result.ok).toBe(true);
        expect(result.json).toBe(JSON.stringify(EMPTY_RESUME));
        expect(localStorage.getItem('resumeData')).toBe(result.json);
        expect(localStorage.getItem('resumeData_lastSaved')).toBe(result.savedAt.toISOString());
        expect(localStorage.getItem('resumeData_backup')).toBeNull();
    });

    it('should also write the backup when backup is asked', () => {
        const { json } = saveResume(EMPTY_RESUME, { backup: true });

        expect(localStorage.getItem('resumeData_backup')).toBe(json);
    });

    it('should return ok false when the storage write fails', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        expect(saveResume(EMPTY_RESUME).ok).toBe(false);
    });
});

describe('writeResume', () => {
    it('should write only the resume when called', () => {
        localStorage.clear();

        expect(writeResume(EMPTY_RESUME)).toBe(true);
        expect(localStorage.getItem('resumeData')).toBe(JSON.stringify(EMPTY_RESUME));
        expect(localStorage.getItem('resumeData_lastSaved')).toBeNull();
    });
});

describe('clearResume', () => {
    it('should remove the resume and saved time but keep the backup when called', () => {
        saveResume(EMPTY_RESUME, { backup: true });

        clearResume();

        expect(localStorage.getItem('resumeData')).toBeNull();
        expect(localStorage.getItem('resumeData_lastSaved')).toBeNull();
        expect(localStorage.getItem('resumeData_backup')).not.toBeNull();
    });
});
