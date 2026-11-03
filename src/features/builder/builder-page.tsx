import { Button } from '@/components/ui/button';
import { PersonalInfoSection } from '@/features/builder/form-sections/personal-info-section';
import { ExperienceSection } from '@/features/builder/form-sections/experience-section';
import { EducationSection } from '@/features/builder/form-sections/education-section';
import { SkillsSection } from '@/features/builder/form-sections/skills-section';
import { LanguagesSection } from '@/features/builder/form-sections/languages-section';
import { InterestsSection } from '@/features/builder/form-sections/interests-section';
import { GdprConsentSection } from '@/features/builder/form-sections/gdpr-consent-section';
import { resumeFormOptions, useAppForm } from '@/features/builder/resume-form';
import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { ParallaxBackground } from '@/components/parallax-background';
import { fadeInUp } from '@/lib/animation-variants';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { EMPTY_RESUME, loadStoredResume } from '@/features/resume/stored-resume';
import { usePdfImport } from '@/features/builder/use-pdf-import';
import { useResumeAutosave } from '@/features/builder/use-resume-autosave';
import { calculateProgress } from '@/features/builder/calculate-progress';
import { FormProgress } from '@/features/builder/form-progress';
import { BuilderToolbar } from '@/features/builder/toolbar/builder-toolbar';
import { isTemplateId, type TemplateId } from '@/lib/template-ids';

const BuilderPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = useSearch({ from: '/builder' });
    const shouldReduceMotion = useReducedMotion();

    // The route drops an unknown templateId, so this is always a real template
    const activeTemplateId: TemplateId = search.templateId ?? 'developer';

    // Read once per mount: stored resume if any, the URL template winning over the stored one
    const [initialValues] = useState(() => {
        const stored = loadStoredResume();
        if (!stored) return { ...EMPTY_RESUME, templateId: activeTemplateId };
        const storedTemplateId = isTemplateId(stored.templateId) ? stored.templateId : undefined;
        return { ...stored, templateId: search.templateId ?? storedTemplateId ?? activeTemplateId };
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
        if (search.templateId && form.getFieldValue('templateId') !== search.templateId) {
            form.setFieldValue('templateId', search.templateId);
        }
    }, [search.templateId, form]);

    const autosave = useResumeAutosave(form);
    const pdfImport = usePdfImport({ form, activeTemplateId });

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
            <BuilderToolbar
                activeTemplateId={activeTemplateId}
                pdfImport={pdfImport}
                autosave={autosave}
                onSave={handleManualSave}
                onReset={handleReset}
            />

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
