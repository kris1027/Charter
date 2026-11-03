import { Button } from '@/components/ui/button';
import { PersonalInfoSection } from '@/features/builder/form-sections/personal-info-section';
import { ExperienceSection } from '@/features/builder/form-sections/experience-section';
import { EducationSection } from '@/features/builder/form-sections/education-section';
import { SkillsSection } from '@/features/builder/form-sections/skills-section';
import { LanguagesSection } from '@/features/builder/form-sections/languages-section';
import { InterestsSection } from '@/features/builder/form-sections/interests-section';
import { GdprConsentSection } from '@/features/builder/form-sections/gdpr-consent-section';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { resumeFormOptions, useAppForm } from '@/features/builder/resume-form';
import { ArrowLeft, CheckCircle, Save, RotateCcw, AlertTriangle, Upload } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { ParallaxBackground } from '@/components/parallax-background';
import { fadeInUp } from '@/lib/animation-variants';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { EMPTY_RESUME, loadStoredResume } from '@/features/resume/stored-resume';
import { usePdfImport } from '@/features/builder/use-pdf-import';
import { PdfErrorDialog } from '@/features/builder/toolbar/pdf-error-dialog';
import { useResumeAutosave } from '@/features/builder/use-resume-autosave';
import { calculateProgress } from '@/features/builder/calculate-progress';
import { FormProgress } from '@/features/builder/form-progress';
import { isTemplateId, type TemplateId } from '@/lib/template-ids';

type BuilderPageProps = {
    templateId?: TemplateId;
};

const BuilderPage = ({ templateId = 'developer' }: BuilderPageProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = useSearch({ from: '/builder' }) as { templateId?: string };
    const shouldReduceMotion = useReducedMotion();

    // Use search param if it names a template, otherwise fall back to prop
    const searchTemplateId = isTemplateId(search.templateId) ? search.templateId : undefined;
    const activeTemplateId = searchTemplateId ?? templateId;

    // Convert template ID to display name
    const getTemplateName = (id: string) => {
        switch (id) {
            case 'developer':
                return t('templates.developer.name');
            case 'default':
                return t('templates.default.name');
            case 'veterinary':
                return t('templates.veterinary.name');
            default:
                return id;
        }
    };

    // Read once per mount: stored resume if any, the URL template winning over the stored one
    const [initialValues] = useState(() => {
        const stored = loadStoredResume();
        if (!stored) return { ...EMPTY_RESUME, templateId: activeTemplateId };
        const storedTemplateId = isTemplateId(stored.templateId) ? stored.templateId : undefined;
        return { ...stored, templateId: searchTemplateId ?? storedTemplateId ?? activeTemplateId };
    });

    const form = useAppForm({
        ...resumeFormOptions,
        defaultValues: initialValues,
        onSubmit: async ({ value }) => {
            // Store data in localStorage for persistence, then preview whether or not it worked
            autosave.save();

            // Navigate to preview page with templateId
            navigate({ to: '/preview', search: { templateId: value.templateId } });
        },
    });

    // Sync form templateId when URL parameter changes
    useEffect(() => {
        if (searchTemplateId && form.getFieldValue('templateId') !== searchTemplateId) {
            form.setFieldValue('templateId', searchTemplateId);
        }
    }, [searchTemplateId, form]);

    const autosave = useResumeAutosave(form);
    const { lastSaved, isAutoSaved, saveError, isSaving } = autosave;

    const {
        fileInputRef,
        isLoading: isLoadingPDF,
        error: pdfLoadError,
        clearError: clearPdfLoadError,
        handleFileChange: handleLoadPDF,
    } = usePdfImport({ form, activeTemplateId });

    // Manual save function
    const handleManualSave = () => autosave.save({ backup: true });

    // Reset form function — keeps backup intact for recovery
    const handleReset = () => {
        autosave.clear();
        // keepDefaultValues: useAppForm re-applies its options each render, and new defaults
        // would make it put the initial resume back
        form.reset({ ...EMPTY_RESUME, templateId: activeTemplateId }, { keepDefaultValues: true });
    };

    return (
        <div className='relative min-h-screen overflow-hidden'>
            <ParallaxBackground />

            {/* Navigation Bar */}
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
                                onChange={handleLoadPDF}
                                accept='.pdf'
                                className='hidden'
                            />
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoadingPDF}
                                className='transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                            >
                                <Upload className='mr-2 h-4 w-4' />
                                {isLoadingPDF ? t('builder.loading') : t('builder.loadPdf')}
                            </Button>
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={handleManualSave}
                                disabled={isSaving}
                                className='transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400'
                            >
                                <Save className='mr-2 h-4 w-4' />
                                {isSaving ? t('builder.saving') : t('builder.save')}
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        size='sm'
                                        className='transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                                    >
                                        <RotateCcw className='mr-2 h-4 w-4' />
                                        {t('builder.reset')}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <div className='flex items-center gap-3'>
                                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
                                                <AlertTriangle className='h-5 w-5 text-red-600 dark:text-red-400' />
                                            </div>
                                            <AlertDialogTitle>
                                                {t('dialogs.reset.title')}
                                            </AlertDialogTitle>
                                        </div>
                                        <AlertDialogDescription className='pt-2'>
                                            {t('dialogs.reset.description')}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            {t('dialogs.reset.cancel')}
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleReset}
                                            className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
                                        >
                                            {t('dialogs.reset.confirm')}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <PdfErrorDialog error={pdfLoadError} onClose={clearPdfLoadError} />

                            {saveError && (
                                <div
                                    className='flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400'
                                    role='alert'
                                >
                                    <AlertTriangle className='h-4 w-4' />
                                    <span className='hidden sm:inline'>
                                        {t('builder.saveFailed')}
                                    </span>
                                </div>
                            )}
                            {lastSaved && !saveError && (
                                <div className='flex items-center gap-2 text-sm text-green-600 dark:text-green-400'>
                                    <CheckCircle className='h-4 w-4' />
                                    <span className='hidden sm:inline'>
                                        {t(isAutoSaved ? 'builder.autoSaved' : 'builder.saved', {
                                            time: lastSaved.toLocaleTimeString(),
                                        })}
                                    </span>
                                </div>
                            )}
                            <div className='rounded-full border border-indigo-200/60 bg-indigo-50/80 px-3 py-1 text-sm text-indigo-700 backdrop-blur-sm dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300'>
                                <span className='hidden sm:inline'>{t('builder.template')}: </span>
                                <span className='font-medium'>
                                    {getTemplateName(activeTemplateId)}
                                </span>
                            </div>
                            <LanguageToggle />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>

            <div className='relative z-[1] container mx-auto max-w-5xl px-4 py-8'>
                {/* Progress Indicator */}
                <FormProgress form={form} />

                <ErrorBoundary>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className='space-y-8'
                    >
                        {/* Personal Information Section */}
                        <motion.div {...fadeInUp(0, shouldReduceMotion)}>
                            <PersonalInfoSection form={form} />
                        </motion.div>

                        {/* Work Experience Section */}
                        <motion.div {...fadeInUp(0.05, shouldReduceMotion)}>
                            <ExperienceSection form={form} />
                        </motion.div>

                        {/* Education Section */}
                        <motion.div {...fadeInUp(0.05, shouldReduceMotion)}>
                            <EducationSection form={form} />
                        </motion.div>

                        {/* Skills Section */}
                        <motion.div {...fadeInUp(0.05, shouldReduceMotion)}>
                            <SkillsSection form={form} />
                        </motion.div>

                        {/* Languages Section */}
                        <motion.div {...fadeInUp(0.05, shouldReduceMotion)}>
                            <LanguagesSection form={form} />
                        </motion.div>

                        {/* Interests Section */}
                        <motion.div {...fadeInUp(0.05, shouldReduceMotion)}>
                            <InterestsSection form={form} />
                        </motion.div>

                        {/* GDPR Consent Section */}
                        <motion.div {...fadeInUp(0.05, shouldReduceMotion)}>
                            <GdprConsentSection form={form} />
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div
                            className='flex items-center justify-between pt-6'
                            {...fadeInUp(0.05, shouldReduceMotion)}
                        >
                            <form.Subscribe
                                selector={(state) =>
                                    [
                                        state.canSubmit,
                                        state.isSubmitting,
                                        state.isValid,
                                        calculateProgress(state.values),
                                    ] as const
                                }
                                children={([canSubmit, isSubmitting, isValid, progress]) => (
                                    <>
                                        <div className='text-sm'>
                                            {!isValid && (
                                                <span className='font-medium text-red-500'>
                                                    {t('builder.validation.fixErrors')}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            type='submit'
                                            disabled={!canSubmit || progress < 30}
                                            size='lg'
                                            className='bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl'
                                        >
                                            {isSubmitting
                                                ? t('builder.processing')
                                                : `${t('builder.previewCv')} →`}
                                        </Button>
                                    </>
                                )}
                            />
                        </motion.div>
                    </form>
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default BuilderPage;
