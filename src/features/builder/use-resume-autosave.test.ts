import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useResumeAutosave } from '@/features/builder/use-resume-autosave';
import type { ResumeFormValues } from '@/features/resume/form-types';
import { EMPTY_RESUME } from '@/features/resume/stored-resume';

const withName = (firstName: string): ResumeFormValues => ({
    ...EMPTY_RESUME,
    personalInfo: { ...EMPTY_RESUME.personalInfo, firstName },
});

const stored = () => JSON.parse(localStorage.getItem('resumeData') ?? 'null');

const setVisibility = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
    document.dispatchEvent(new Event('visibilitychange'));
};

// Saves once, so the hook's last saved JSON matches the values; then edits
const setup = () => {
    const form = { state: { values: withName('Ada') } };
    const hook = renderHook(() => useResumeAutosave(form));
    act(() => {
        hook.result.current.save();
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const edit = (firstName: string) => {
        form.state = { values: withName(firstName) };
    };
    return { hook, edit, setItem };
};

describe('useResumeAutosave on hide (spec 0009, AC-3)', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
    });

    it('should write the resume when the page fires pagehide after an edit', () => {
        const { edit } = setup();
        edit('Grace');

        act(() => {
            window.dispatchEvent(new Event('pagehide'));
        });

        expect(stored().personalInfo.firstName).toBe('Grace');
    });

    it('should write nothing when pagehide fires again with no edit', () => {
        const { edit, setItem } = setup();
        edit('Grace');
        act(() => {
            window.dispatchEvent(new Event('pagehide'));
        });
        setItem.mockClear();

        act(() => {
            window.dispatchEvent(new Event('pagehide'));
        });

        expect(setItem).not.toHaveBeenCalled();
    });

    it('should write the resume when the tab turns hidden after an edit', () => {
        const { edit } = setup();
        edit('Grace');

        act(() => setVisibility('hidden'));

        expect(stored().personalInfo.firstName).toBe('Grace');
    });

    it('should write nothing when the tab turns visible', () => {
        const { edit, setItem } = setup();
        edit('Grace');

        act(() => setVisibility('visible'));

        expect(setItem).not.toHaveBeenCalled();
    });

    it('should write nothing before the tick when the user only types', () => {
        const { edit, setItem } = setup();

        edit('G');
        edit('Gr');
        act(() => vi.advanceTimersByTime(29_000));

        expect(setItem).not.toHaveBeenCalled();
    });

    it('should write the resume when the builder unmounts after an edit', () => {
        const { hook, edit } = setup();
        edit('Grace');

        hook.unmount();

        expect(stored().personalInfo.firstName).toBe('Grace');
    });

    it('should write nothing when the builder unmounts with no edit', () => {
        const { hook, setItem } = setup();

        hook.unmount();

        expect(setItem).not.toHaveBeenCalled();
    });

    it('should write nothing when the builder unmounts right after loading the stored resume', () => {
        localStorage.setItem('resumeData', JSON.stringify(withName('Ada')));
        const form = { state: { values: withName('Ada') } };
        const hook = renderHook(() => useResumeAutosave(form));
        const setItem = vi.spyOn(Storage.prototype, 'setItem');

        hook.unmount();

        expect(setItem).not.toHaveBeenCalled();
    });

    it('should write the values when they differ from storage at mount and the page hides', () => {
        localStorage.setItem('resumeData', JSON.stringify(withName('Ada')));
        const values: ResumeFormValues = { ...withName('Ada'), templateId: 'veterinary' };
        const form = { state: { values } };
        renderHook(() => useResumeAutosave(form));

        window.dispatchEvent(new Event('pagehide'));

        expect(stored().templateId).toBe('veterinary');
    });
});
