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
import type {
    EducationProps,
    ExperienceProps,
    InterestProps,
    LanguageLevelProps,
    LanguageProps,
    SkillProps,
} from '@/features/resume/form-types';
import { resumeFormOptions, useAppForm } from '@/features/builder/resume-form';
import {
    ArrowLeft,
    CheckCircle,
    Save,
    RotateCcw,
    AlertTriangle,
    Upload,
    FileWarning,
} from 'lucide-react';
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
import { useState, useRef, useEffect } from 'react';
import { loadResumeFromPDF } from '@/features/pdf/pdf-parser';
import { useNavigate, Link, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { ParallaxBackground } from '@/components/parallax-background';
import { fadeInUp } from '@/lib/animation-variants';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
    clearResume,
    EMPTY_RESUME,
    loadStoredResume,
    normalizeResume,
    saveResume,
    writeResume,
} from '@/features/resume/stored-resume';
import type { FormApi } from '@/features/builder/form-component-types';
import { isTemplateId, type TemplateId } from '@/lib/template-ids';

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

type BuilderPageProps = {
    templateId?: TemplateId;
};

const BuilderPage = ({ templateId = 'developer' }: BuilderPageProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = useSearch({ from: '/builder' }) as { templateId?: string };
    const shouldReduceMotion = useReducedMotion();

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isAutoSaved, setIsAutoSaved] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const [isLoadingPDF, setIsLoadingPDF] = useState(false);
    const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastSavedJsonRef = useRef<string>('');

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
            // Store data in localStorage for persistence
            const { ok, json, savedAt } = saveResume(value);
            lastSavedJsonRef.current = json;
            setSaveError(!ok);
            setIsAutoSaved(false);
            setLastSaved(savedAt);

            // Navigate to preview page with templateId
            navigate({ to: '/preview', search: { templateId: value.templateId } });
        },
    });

    // Form sections take a loosely typed FormApi, so widen the strongly typed form once here
    const sectionForm = form as unknown as FormApi;

    // Sync form templateId when URL parameter changes
    useEffect(() => {
        if (searchTemplateId && form.getFieldValue('templateId') !== searchTemplateId) {
            form.setFieldValue('templateId', searchTemplateId);
        }
    }, [searchTemplateId, form]);

    // Auto-save every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const formData = form.state.values;
            if (JSON.stringify(formData) === lastSavedJsonRef.current) return;

            const { ok, json, savedAt } = saveResume(formData);
            lastSavedJsonRef.current = json;
            setSaveError(!ok);
            setIsAutoSaved(true);
            setLastSaved(savedAt);
        }, 30_000);

        return () => clearInterval(interval);
    }, [form]);

    // Manual save function
    const handleManualSave = () => {
        setIsSaving(true);
        const { ok, json, savedAt } = saveResume(form.state.values, { backup: true });
        lastSavedJsonRef.current = json;
        setSaveError(!ok);
        setIsAutoSaved(false);
        setLastSaved(savedAt);
        setTimeout(() => setIsSaving(false), 500);
    };

    // Reset form function — keeps backup intact for recovery
    const handleReset = () => {
        clearResume();
        setLastSaved(null);
        // keepDefaultValues: useAppForm re-applies its options each render, and new defaults
        // would make it put the initial resume back
        form.reset({ ...EMPTY_RESUME, templateId: activeTemplateId }, { keepDefaultValues: true });
    };

    const handleLoadPDF = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_PDF_SIZE) {
            setPdfLoadError(t('builder.pdfTooLarge'));
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        setIsLoadingPDF(true);
        try {
            const resumeData = await loadResumeFromPDF(file);

            // Normalize PDF data by merging with defaults to backfill missing keys.
            // PDF metadata (ResumeData) doesn't include templateId — fall back to
            // the currently active template so form.reset() gets a valid string
            // and the Zod schema doesn't trigger a "fix errors" validation message.
            const newValues = {
                ...normalizeResume(resumeData),
                templateId: resumeData.templateId || activeTemplateId,
            };

            // Persist so a reload shows the import
            writeResume(newValues);

            // Reset the form with all values at once — no intermediate
            // validation states and no stale errors
            form.reset(newValues, { keepDefaultValues: true });

            // PDF loaded - user can manually save when ready
        } catch (error) {
            if (import.meta.env.DEV) console.error('Error loading PDF:', error);
            const errorMessage =
                error instanceof Error ? error.message : t('dialogs.pdfError.unexpected');
            setPdfLoadError(errorMessage);
        } finally {
            setIsLoadingPDF(false);
            // Reset file input so the same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const addExperience = () => {
        form.setFieldValue('experiences', [
            {
                company: '',
                position: '',
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                description: '',
            },
            ...(form.getFieldValue('experiences') as ExperienceProps[]),
        ]);
    };

    const removeExperience = (index: number) => {
        const experiences = form.getFieldValue('experiences') as ExperienceProps[];
        form.setFieldValue(
            'experiences',
            experiences.filter((_, i) => i !== index),
        );
    };

    const reorderExperiences = (oldIndex: number, newIndex: number) => {
        const experiences = [...(form.getFieldValue('experiences') as ExperienceProps[])];
        const [removed] = experiences.splice(oldIndex, 1);
        experiences.splice(newIndex, 0, removed);
        form.setFieldValue('experiences', experiences);
    };

    const addEducation = () => {
        form.setFieldValue('education', [
            ...(form.getFieldValue('education') as EducationProps[]),
            {
                institution: '',
                degree: '',
                field: '',
                startDate: '',
                endDate: '',
                description: '',
            },
        ]);
    };

    const removeEducation = (index: number) => {
        const education = form.getFieldValue('education') as EducationProps[];
        form.setFieldValue(
            'education',
            education.filter((_, i) => i !== index),
        );
    };

    const reorderEducation = (oldIndex: number, newIndex: number) => {
        const education = [...(form.getFieldValue('education') as EducationProps[])];
        const [removed] = education.splice(oldIndex, 1);
        education.splice(newIndex, 0, removed);
        form.setFieldValue('education', education);
    };

    const addSkill = () => {
        form.setFieldValue('skills', [
            ...(form.getFieldValue('skills') as SkillProps[]),
            { name: '' },
        ]);
    };

    const removeSkill = (index: number) => {
        const skills = form.getFieldValue('skills') as SkillProps[];
        form.setFieldValue(
            'skills',
            skills.filter((_, i) => i !== index),
        );
    };

    const reorderSkills = (oldIndex: number, newIndex: number) => {
        const skills = [...(form.getFieldValue('skills') as SkillProps[])];
        const [removed] = skills.splice(oldIndex, 1);
        skills.splice(newIndex, 0, removed);
        form.setFieldValue('skills', skills);
    };

    const addLanguage = () => {
        form.setFieldValue('languages', [
            ...(form.getFieldValue('languages') as LanguageProps[]),
            { language: '', proficiency: 'A1' as LanguageLevelProps },
        ]);
    };

    const removeLanguage = (index: number) => {
        const languages = form.getFieldValue('languages') as LanguageProps[];
        form.setFieldValue(
            'languages',
            languages.filter((_, i) => i !== index),
        );
    };

    const reorderLanguages = (oldIndex: number, newIndex: number) => {
        const languages = [...(form.getFieldValue('languages') as LanguageProps[])];
        const [removed] = languages.splice(oldIndex, 1);
        languages.splice(newIndex, 0, removed);
        form.setFieldValue('languages', languages);
    };

    const addInterest = () => {
        form.setFieldValue('interests', [
            ...(form.getFieldValue('interests') as InterestProps[]),
            { name: '' },
        ]);
    };

    const removeInterest = (index: number) => {
        const interests = form.getFieldValue('interests') as InterestProps[];
        form.setFieldValue(
            'interests',
            interests.filter((_, i) => i !== index),
        );
    };

    const reorderInterests = (oldIndex: number, newIndex: number) => {
        const interests = [...(form.getFieldValue('interests') as InterestProps[])];
        const [removed] = interests.splice(oldIndex, 1);
        interests.splice(newIndex, 0, removed);
        form.setFieldValue('interests', interests);
    };

    // Calculate form progress
    const calculateProgress = () => {
        const values = form.state.values;
        let progress = 0;

        // Personal info (30%)
        if (values.personalInfo.firstName) progress += 10;
        if (values.personalInfo.lastName) progress += 10;
        if (values.personalInfo.email) progress += 10;

        // Experience (25%)
        if (values.experiences.length > 0) progress += 25;

        // Education (20%)
        if (values.education.length > 0) progress += 20;

        // Skills (15%)
        if (values.skills.length > 0) progress += 15;

        // Languages (5%)
        if (values.languages.length > 0) progress += 5;

        // Interests (5%)
        if (values.interests.length > 0) progress += 5;

        return Math.min(progress, 100);
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

                            {/* PDF Load Error Dialog */}
                            <AlertDialog
                                open={!!pdfLoadError}
                                onOpenChange={(open) => !open && setPdfLoadError(null)}
                            >
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <div className='flex items-center gap-3'>
                                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30'>
                                                <FileWarning className='h-5 w-5 text-orange-600 dark:text-orange-400' />
                                            </div>
                                            <AlertDialogTitle>
                                                {t('dialogs.pdfError.title')}
                                            </AlertDialogTitle>
                                        </div>
                                        <AlertDialogDescription className='pt-2'>
                                            {pdfLoadError}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogAction onClick={() => setPdfLoadError(null)}>
                                            {t('dialogs.pdfError.ok')}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

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
                <motion.div
                    className='mb-8 rounded-2xl border border-white/20 bg-white/60 p-5 backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.03]'
                    {...fadeInUp(0, shouldReduceMotion)}
                >
                    <div className='mb-3 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                            <div
                                className='inline-flex rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2 text-white shadow-lg'
                                aria-hidden='true'
                            >
                                <CheckCircle className='h-4 w-4' />
                            </div>
                            <span className='font-display text-sm font-semibold dark:text-slate-200'>
                                {t('builder.progress.title')}
                            </span>
                        </div>
                        <span className='rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-0.5 text-xs font-bold text-white shadow-sm'>
                            {calculateProgress()}%
                        </span>
                    </div>
                    <div className='h-3 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10'>
                        <div
                            className='h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 shadow-sm shadow-indigo-500/25 transition-all duration-500 ease-out'
                            style={{ width: `${calculateProgress()}%` }}
                        />
                    </div>
                    <div className='text-muted-foreground mt-2 text-xs'>
                        {calculateProgress() === 100
                            ? t('builder.progress.complete')
                            : t('builder.progress.incomplete')}
                    </div>
                </motion.div>

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
                            <ExperienceSection
                                form={sectionForm}
                                addExperience={addExperience}
                                removeExperience={removeExperience}
                                reorderExperiences={reorderExperiences}
                            />
                        </motion.div>

                        {/* Education Section */}
                        <motion.div {...fadeInUp(0.05, shouldReduceMotion)}>
                            <EducationSection
                                form={sectionForm}
                                addEducation={addEducation}
                                removeEducation={removeEducation}
                                reorderEducation={reorderEducation}
                            />
                        </motion.div>

                        {/* Skills Section */}
                        <motion.div {...fadeInUp(0.05, shouldReduceMotion)}>
                            <SkillsSection
                                form={sectionForm}
                                addSkill={addSkill}
                                removeSkill={removeSkill}
                                reorderSkills={reorderSkills}
                            />
                        </motion.div>

                        {/* Languages Section */}
                        <motion.div {...fadeInUp(0.05, shouldReduceMotion)}>
                            <LanguagesSection
                                form={sectionForm}
                                addLanguage={addLanguage}
                                removeLanguage={removeLanguage}
                                reorderLanguages={reorderLanguages}
                            />
                        </motion.div>

                        {/* Interests Section */}
                        <motion.div {...fadeInUp(0.05, shouldReduceMotion)}>
                            <InterestsSection
                                form={sectionForm}
                                addInterest={addInterest}
                                removeInterest={removeInterest}
                                reorderInterests={reorderInterests}
                            />
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
                                selector={(state) => [
                                    state.canSubmit,
                                    state.isSubmitting,
                                    state.isValid,
                                ]}
                                children={([canSubmit, isSubmitting, isValid]) => (
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
                                            disabled={!canSubmit || calculateProgress() < 30}
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
