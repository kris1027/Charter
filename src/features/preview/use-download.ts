import { useState } from 'react';
import { exportToPDF, generateResumeFilename, savePdf } from '@/features/pdf/pdf-export';
import type { ResumeData } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';

type UseDownloadOptions = {
    data: ResumeData;
    templateId: TemplateId;
    lang: AppLang;
    // The kept bytes for the selected mode, when there are any
    shown: { pdf: ArrayBuffer } | null;
    // The selected mode's scale, for the fallback export
    scale: number;
};

// Download PDF (spec 0013): saves the bytes on screen at once (AC-19). Without them (before the
// first render, worker unavailable, render failed) it falls back to a fresh export (AC-20)
export const useDownload = ({ data, templateId, lang, shown, scale }: UseDownloadOptions) => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportFailed, setExportFailed] = useState(false);

    const download = async () => {
        const filename = generateResumeFilename(
            data.personalInfo?.firstName,
            data.personalInfo?.lastName,
        );
        if (shown) {
            // A Blob copies the bytes, so the kept buffer stays whole
            savePdf(new Blob([shown.pdf], { type: 'application/pdf' }), filename);
            return;
        }
        setIsExporting(true);
        try {
            await exportToPDF(data, templateId, { filename, compactScale: scale, lang });
        } catch (error) {
            if (import.meta.env.DEV) console.error('Failed to export PDF:', error);
            setExportFailed(true);
        }
        setIsExporting(false);
    };

    return {
        download,
        isExporting,
        exportFailed,
        dismissExportError: () => setExportFailed(false),
    };
};
