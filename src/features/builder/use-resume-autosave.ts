import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { ResumeFormValues } from '@/features/resume/form-types';
import { clearResume, saveResume } from '@/features/resume/stored-resume';

const AUTOSAVE_INTERVAL_MS = 30_000;
const SAVING_HOLD_MS = 500;

type FormWithValues = { state: { values: ResumeFormValues } };

// Save state for the builder: the 30 second autosave, manual save, submit save and reset
export const useResumeAutosave = (form: FormWithValues) => {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isAutoSaved, setIsAutoSaved] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // Starts empty, so the first tick after mount writes once even with no edit
    const lastSavedJsonRef = useRef('');

    // The manual save is the one that writes a backup, and it shows Saving… for a moment
    const save = ({ backup = false, autosaved = false } = {}) => {
        if (backup) setIsSaving(true);
        const { ok, json, savedAt } = saveResume(form.state.values, { backup });
        lastSavedJsonRef.current = json;
        setSaveError(!ok);
        setIsAutoSaved(autosaved);
        setLastSaved(savedAt);
        if (backup) setTimeout(() => setIsSaving(false), SAVING_HOLD_MS);
        return ok;
    };

    // An effect event, so the interval always sees the latest save without restarting
    const autosaveTick = useEffectEvent(() => {
        if (JSON.stringify(form.state.values) === lastSavedJsonRef.current) return;
        save({ autosaved: true });
    });

    useEffect(() => {
        const interval = setInterval(autosaveTick, AUTOSAVE_INTERVAL_MS);
        return () => clearInterval(interval);
    }, []);

    // Keeps the backup; the last saved JSON, error and autosaved flag stay as they were
    const clear = () => {
        clearResume();
        setLastSaved(null);
    };

    return { lastSaved, isAutoSaved, saveError, isSaving, save, clear };
};

export type ResumeAutosave = ReturnType<typeof useResumeAutosave>;
