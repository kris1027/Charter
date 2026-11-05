import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { ResumeFormValues } from '@/features/resume/form-types';
import { clearResume, readStoredResumeJson, saveResume } from '@/features/resume/stored-resume';

const AUTOSAVE_INTERVAL_MS = 30_000;
const SAVING_HOLD_MS = 500;

type FormWithValues = { state: { values: ResumeFormValues } };

// Save state for the builder: the 30 second autosave, manual save, submit save and reset
export const useResumeAutosave = (form: FormWithValues) => {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isAutoSaved, setIsAutoSaved] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // Starts from what is stored, so leaving or hiding the builder with no edit writes nothing,
    // while values that differ from storage (a template from the URL) still get saved
    const [storedJson] = useState(readStoredResumeJson);
    const lastSavedJsonRef = useRef(storedJson);

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

    // Closing or hiding the tab saves the last edits too; leaving /builder through an in app link
    // fires neither event, so the unmount runs the same check. It only writes: no state updates
    // on an unmounting component (spec 0009, AC-3)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') autosaveTick();
        };
        window.addEventListener('pagehide', autosaveTick);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('pagehide', autosaveTick);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            const values = form.state.values;
            if (JSON.stringify(values) === lastSavedJsonRef.current) return;
            lastSavedJsonRef.current = saveResume(values).json;
        };
    }, [form]);

    // Keeps the backup; the last saved JSON, error and autosaved flag stay as they were
    const clear = () => {
        clearResume();
        setLastSaved(null);
    };

    return { lastSaved, isAutoSaved, saveError, isSaving, save, clear };
};

export type ResumeAutosave = ReturnType<typeof useResumeAutosave>;
