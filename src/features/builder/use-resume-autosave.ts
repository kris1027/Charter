import { useEffect, useRef, useState } from 'react';
import type { ResumeFormValues } from '@/features/resume/form-types';
import { clearResume, saveResume } from '@/features/resume/stored-resume';

const AUTOSAVE_INTERVAL_MS = 30_000;
const SAVING_HOLD_MS = 500;

type ResumeForm = { state: { values: ResumeFormValues } };

// Save state for the builder: the 30 second autosave, manual save, submit save and reset
export const useResumeAutosave = (form: ResumeForm) => {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isAutoSaved, setIsAutoSaved] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // Starts empty, so the first tick after mount writes once even with no edit
    const lastSavedJsonRef = useRef('');

    useEffect(() => {
        const interval = setInterval(() => {
            const values = form.state.values;
            if (JSON.stringify(values) === lastSavedJsonRef.current) return;

            const { ok, json, savedAt } = saveResume(values);
            lastSavedJsonRef.current = json;
            setSaveError(!ok);
            setIsAutoSaved(true);
            setLastSaved(savedAt);
        }, AUTOSAVE_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [form]);

    // The manual save is the one that writes a backup, and it shows Saving… for a moment
    const save = ({ backup = false } = {}) => {
        if (backup) setIsSaving(true);
        const { ok, json, savedAt } = saveResume(form.state.values, { backup });
        lastSavedJsonRef.current = json;
        setSaveError(!ok);
        setIsAutoSaved(false);
        setLastSaved(savedAt);
        if (backup) setTimeout(() => setIsSaving(false), SAVING_HOLD_MS);
        return ok;
    };

    // Keeps the backup; the last saved JSON, error and autosaved flag stay as they were
    const clear = () => {
        clearResume();
        setLastSaved(null);
    };

    return { lastSaved, isAutoSaved, saveError, isSaving, save, clear };
};
