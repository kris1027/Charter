import { useRef, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ExportErrorDialog } from '@/features/preview/export-error-dialog';
import { PreviewArea } from '@/features/preview/preview-area';
import { PreviewEmptyState } from '@/features/preview/preview-empty-state';
import { resolveTemplateId } from '@/features/preview/preview-search';
import { PreviewStrip } from '@/features/preview/preview-strip';
import { PreviewToolbar } from '@/features/preview/preview-toolbar';
import { useDownload } from '@/features/preview/use-download';
import { usePreviewDocument } from '@/features/preview/use-preview-document';
import { loadStoredResume, type StoredResume } from '@/features/resume/stored-resume';
import { normalizeLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';

type SavedResumePreviewProps = { data: StoredResume; templateId: TemplateId };

// The full page. Only this component starts the preview worker (spec 0013, AC-25)
const SavedResumePreview = ({ data, templateId }: SavedResumePreviewProps) => {
    const { i18n } = useTranslation();
    const lang = normalizeLang(i18n.language);
    const downloadRef = useRef<HTMLButtonElement>(null);
    const source = { data, templateId, lang };
    const preview = usePreviewDocument(source);
    const { download, isExporting, exportFailed, dismissExportError } = useDownload(
        source,
        preview,
    );

    return (
        <>
            <PreviewToolbar
                actions={{ templateId, onDownload: download, isExporting, downloadRef }}
            />
            <PreviewStrip
                pages={preview.shown?.pages ?? null}
                fit={preview.fit}
                mode={preview.mode}
                onModeChange={preview.setMode}
            />
            <PreviewArea
                status={preview.status}
                pdf={preview.shown?.pdf ?? null}
                onRetry={preview.retry}
            />
            <ExportErrorDialog
                open={exportFailed}
                onClose={dismissExportError}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    downloadRef.current?.focus();
                }}
            />
        </>
    );
};

// /preview (spec 0013): the saved resume drawn by the preview worker, or a way to start.
// No overflow class here or above, so the toolbar and the strip can stick (AC-1)
export const PreviewPage = () => {
    const { templateId: searchTemplateId } = useSearch({ from: '/preview' });
    // Loaded once, so its identity never changes and never restarts the render
    const [resume] = useState(loadStoredResume);
    const templateId = resolveTemplateId(searchTemplateId, resume?.templateId);

    return (
        <div data-preview-page className='bg-background flex min-h-screen flex-col'>
            {resume ? (
                <SavedResumePreview data={resume} templateId={templateId} />
            ) : (
                <>
                    <PreviewToolbar />
                    <PreviewEmptyState templateId={templateId} />
                </>
            )}
        </div>
    );
};
