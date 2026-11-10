import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { BuilderActionsMenu } from '@/features/builder/toolbar/builder-actions-menu';
import { PdfErrorDialog } from '@/features/builder/toolbar/pdf-error-dialog';
import { SaveStatus } from '@/features/builder/toolbar/save-status';
import type { PdfImport } from '@/features/builder/use-pdf-import';
import type { ResumeAutosave } from '@/features/builder/use-resume-autosave';
import type { TemplateId } from '@/lib/template-ids';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, PanelRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type BuilderToolbarProps = {
    activeTemplateId: TemplateId;
    pdfImport: PdfImport;
    autosave: ResumeAutosave;
    onSave: () => void;
    onReset: () => void;
    previewOpen: boolean;
    onTogglePreview: () => void;
    // Preview CV, passed in so the toolbar never needs the form type
    previewButton: ReactNode;
};

// The 56px sticky bar (spec 0012, AC-4 to AC-9): the template link and title on the left, then
// save status, the panel toggle, Preview CV, the actions menu and the shell toggles
export const BuilderToolbar = ({
    activeTemplateId,
    pdfImport,
    autosave,
    onSave,
    onReset,
    previewOpen,
    onTogglePreview,
    previewButton,
}: BuilderToolbarProps) => {
    const { t } = useTranslation();
    const { fileInputRef, isLoading, error, clearError, handleFileChange } = pdfImport;
    const templateName = t(`templates.${activeTemplateId}.name`);

    return (
        <div className='bg-background sticky top-0 z-10 h-14 border-b'>
            <div className='container mx-auto flex h-full items-center gap-1 px-4 sm:gap-2'>
                <Button asChild variant='ghost' size='sm' className='min-w-0 shrink'>
                    <Link
                        to='/templates'
                        aria-label={t('builder.changeTemplate', { name: templateName })}
                    >
                        <ArrowLeft aria-hidden='true' />
                        <span className='hidden truncate sm:inline'>{templateName}</span>
                    </Link>
                </Button>
                <h1 className='font-display sr-only truncate text-lg font-semibold md:not-sr-only'>
                    {t('builder.title')}
                </h1>

                <div className='ml-auto flex shrink-0 items-center gap-1 sm:gap-2'>
                    <SaveStatus
                        isImporting={isLoading}
                        saveError={autosave.saveError}
                        lastSaved={autosave.lastSaved}
                        isAutoSaved={autosave.isAutoSaved}
                    />
                    {/* Wide screens only; narrow screens get the floating Preview button */}
                    <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        aria-pressed={previewOpen}
                        onClick={onTogglePreview}
                        // xl matches WIDE_PREVIEW_QUERY, where the panel can show
                        className='hidden xl:inline-flex'
                    >
                        <PanelRight aria-hidden='true' />
                        {previewOpen
                            ? t('builder.livePreview.hide')
                            : t('builder.livePreview.show')}
                    </Button>
                    {previewButton}
                    <BuilderActionsMenu
                        isImporting={isLoading}
                        isSaving={autosave.isSaving}
                        onLoadPdf={() => fileInputRef.current?.click()}
                        onSave={onSave}
                        onReset={onReset}
                    />
                    <LanguageToggle />
                    <ThemeToggle />
                </div>
            </div>

            {/* Stays mounted outside the menu, so a pick still lands after the menu closes */}
            <input
                type='file'
                ref={fileInputRef}
                onChange={handleFileChange}
                accept='.pdf'
                className='hidden'
                aria-label={t('builder.loadPdf')}
            />
            <PdfErrorDialog error={error} onClose={clearError} />
        </div>
    );
};
