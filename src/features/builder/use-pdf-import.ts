import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadResumeFromPDF } from '@/features/pdf/pdf-parser';
import type { ResumeFormValues } from '@/features/resume/form-types';
import { normalizeResume, writeResume } from '@/features/resume/stored-resume';
import type { TemplateId } from '@/lib/template-ids';

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

type ResumeForm = {
    reset: (values: ResumeFormValues, opts?: { keepDefaultValues?: boolean }) => void;
};

type UsePdfImportOptions = {
    form: ResumeForm;
    activeTemplateId: TemplateId;
};

// Fills the form from a PDF picked through a hidden file input
export const usePdfImport = ({ form, activeTemplateId }: UsePdfImportOptions) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Clear the input so the same file can be picked again
    const resetInput = () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_PDF_SIZE) {
            setError(t('builder.pdfTooLarge'));
            resetInput();
            return;
        }

        setIsLoading(true);
        try {
            const resumeData = await loadResumeFromPDF(file);

            // Backfill missing keys; fall back to the active template so the schema stays valid
            const newValues = {
                ...normalizeResume(resumeData),
                templateId: resumeData.templateId || activeTemplateId,
            };

            // Persist so a reload shows the import
            writeResume(newValues);

            // Reset the form with all values at once — no intermediate validation states and
            // no stale errors. keepDefaultValues stops the next render putting the old resume back.
            form.reset(newValues, { keepDefaultValues: true });
        } catch (err) {
            if (import.meta.env.DEV) console.error('Error loading PDF:', err);
            setError(err instanceof Error ? err.message : t('dialogs.pdfError.unexpected'));
        } finally {
            setIsLoading(false);
            resetInput();
        }
    };

    return { fileInputRef, isLoading, error, clearError: () => setError(null), handleFileChange };
};
