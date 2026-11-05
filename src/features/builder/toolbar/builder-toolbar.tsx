import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { PdfErrorDialog } from '@/features/builder/toolbar/pdf-error-dialog';
import { ResetDialog } from '@/features/builder/toolbar/reset-dialog';
import { SaveStatus } from '@/features/builder/toolbar/save-status';
import type { PdfImport } from '@/features/builder/use-pdf-import';
import type { ResumeAutosave } from '@/features/builder/use-resume-autosave';
import type { TemplateId } from '@/lib/template-ids';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, PanelRight, Save, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type BuilderToolbarProps = {
    activeTemplateId: TemplateId;
    pdfImport: PdfImport;
    autosave: ResumeAutosave;
    onSave: () => void;
    onReset: () => void;
    previewOpen: boolean;
    onTogglePreview: () => void;
};

export const BuilderToolbar = ({
    activeTemplateId,
    pdfImport,
    autosave,
    onSave,
    onReset,
    previewOpen,
    onTogglePreview,
}: BuilderToolbarProps) => {
    const { t } = useTranslation();
    const { fileInputRef, isLoading, error, clearError, handleFileChange } = pdfImport;

    return (
        <div className='sticky top-0 z-10 border-b border-white/20 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80'>
            <div className='container mx-auto px-4 py-4'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <Button asChild variant='outline' size='sm'>
                            <Link to='/templates'>
                                <ArrowLeft className='mr-2 h-4 w-4' />
                                {t('nav.backToTemplates')}
                            </Link>
                        </Button>
                        <h1 className='font-display bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400'>
                            {t('builder.title')}
                        </h1>
                    </div>
                    <div className='flex items-center gap-3'>
                        {/* Hidden file input for PDF loading */}
                        <input
                            type='file'
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept='.pdf'
                            className='hidden'
                            aria-label={t('builder.loadPdf')}
                        />
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className='transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                        >
                            <Upload className='mr-2 h-4 w-4' />
                            {isLoading ? t('builder.loading') : t('builder.loadPdf')}
                        </Button>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={onSave}
                            disabled={autosave.isSaving}
                            className='transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400'
                        >
                            <Save className='mr-2 h-4 w-4' />
                            {autosave.isSaving ? t('builder.saving') : t('builder.save')}
                        </Button>
                        <ResetDialog onConfirm={onReset} />
                        {/* Wide screens only; narrow screens get the floating Preview button */}
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            aria-pressed={previewOpen}
                            onClick={onTogglePreview}
                            className='hidden xl:inline-flex'
                        >
                            <PanelRight className='mr-2 h-4 w-4' />
                            {previewOpen
                                ? t('builder.livePreview.hide')
                                : t('builder.livePreview.show')}
                        </Button>

                        <PdfErrorDialog error={error} onClose={clearError} />

                        <SaveStatus
                            saveError={autosave.saveError}
                            lastSaved={autosave.lastSaved}
                            isAutoSaved={autosave.isAutoSaved}
                        />
                        <div className='rounded-full border border-indigo-200/60 bg-indigo-50/80 px-3 py-1 text-sm text-indigo-700 backdrop-blur-sm dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300'>
                            <span className='hidden sm:inline'>{t('builder.template')}: </span>
                            <span className='font-medium'>
                                {t(`templates.${activeTemplateId}.name`)}
                            </span>
                        </div>
                        <LanguageToggle />
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </div>
    );
};
