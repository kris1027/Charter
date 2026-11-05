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
import { m, useReducedMotion } from 'motion/react';
import { ParallaxBackground } from '@/components/parallax-background';
import { fadeInUp } from '@/lib/animation-variants';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { EMPTY_RESUME, loadStoredResume } from '@/features/resume/stored-resume';
import { usePdfImport } from '@/features/builder/use-pdf-import';
import { useResumeAutosave } from '@/features/builder/use-resume-autosave';
import { canOpenPreview } from '@/features/builder/calculate-progress';
import { FormProgress } from '@/features/builder/form-progress';
import { BuilderToolbar } from '@/features/builder/toolbar/builder-toolbar';
import { isTemplateId, type TemplateId } from '@/lib/template-ids';
import { normalizeLang } from '@/lib/app-lang';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useLivePreview } from '@/features/builder/live-preview/use-live-preview';
import { usePreviewOpen } from '@/features/builder/live-preview/use-preview-open';
import {
    LivePreviewPanel,
    WIDE_PREVIEW_QUERY,
} from '@/features/builder/live-preview/live-preview-panel';
import { LivePreviewSheet } from '@/features/builder/live-preview/live-preview-sheet';
import { OpenPreviewButton } from '@/features/builder/live-preview/open-preview-button';

const emptyResumeFor = (templateId: TemplateId) => ({ ...EMPTY_RESUME, templateId });

const BuilderPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const search = useSearch({ from: '/builder' });
    const shouldReduceMotion = useReducedMotion();

    // The route drops an unknown templateId, so this is always a real template
    const activeTemplateId: TemplateId = search.templateId ?? 'developer';

    // Read once per mount: stored resume if any, the URL template winning over the stored one
    const [initialValues] = useState(() => {
        const stored = loadStoredResume();
        if (!stored) return emptyResumeFor(activeTemplateId);
        const storedTemplateId = isTemplateId(stored.templateId) ? stored.templateId : undefined;
        return { ...stored, templateId: search.templateId ?? storedTemplateId ?? activeTemplateId };
    });

    const form = useAppForm({
        ...resumeFormOptions,
        defaultValues: initialValues,
        onSubmit: async ({ value }) => {
            // Store data in localStorage for persistence, then preview whether or not it worked.
            // autosave is declared below because it needs form; submit only runs after render.
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

    // Live preview (spec 0009): a side panel from 1280px, a sheet below that
    const isWide = useMediaQuery(WIDE_PREVIEW_QUERY);
    const previewPanel = usePreviewOpen();
    const [sheetOpen, setSheetOpen] = useState(false);
    const showPanel = isWide && previewPanel.open;
    const livePreview = useLivePreview({
        form,
        templateId: activeTemplateId,
        lang: normalizeLang(i18n.language),
        active: showPanel || (!isWide && sheetOpen),
    });
    const openPreviewButton = <OpenPreviewButton form={form} />;

    // Manual save function
    const handleManualSave = () => autosave.save({ backup: true });

    // Reset form function — keeps backup intact for recovery
    const handleReset = () => {
        autosave.clear();
        // keepDefaultValues: useAppForm re-applies its options each render, and new defaults
        // would make it put the initial resume back
        form.reset(emptyResumeFor(activeTemplateId), { keepDefaultValues: true });
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
                previewOpen={previewPanel.open}
                onTogglePreview={previewPanel.toggle}
            />

            <div
                className={`relative z-[1] container mx-auto px-4 py-8 ${showPanel ? 'grid max-w-[1600px] grid-cols-2 items-start gap-8' : 'max-w-5xl'}`}
            >
                <div className='min-w-0'>
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
                            <m.div {...fadeInUp(0, shouldReduceMotion)}>
                                <PersonalInfoSection form={form} />
                            </m.div>

                            {/* Work Experience Section */}
                            <m.div {...fadeInUp(0.05, shouldReduceMotion)}>
                                <ExperienceSection form={form} />
                            </m.div>

                            {/* Education Section */}
                            <m.div {...fadeInUp(0.05, shouldReduceMotion)}>
                                <EducationSection form={form} />
                            </m.div>

                            {/* Skills Section */}
                            <m.div {...fadeInUp(0.05, shouldReduceMotion)}>
                                <SkillsSection form={form} />
                            </m.div>

                            {/* Languages Section */}
                            <m.div {...fadeInUp(0.05, shouldReduceMotion)}>
                                <LanguagesSection form={form} />
                            </m.div>

                            {/* Interests Section */}
                            <m.div {...fadeInUp(0.05, shouldReduceMotion)}>
                                <InterestsSection form={form} />
                            </m.div>

                            {/* GDPR Consent Section */}
                            <m.div {...fadeInUp(0.05, shouldReduceMotion)}>
                                <GdprConsentSection form={form} />
                            </m.div>

                            {/* Submit Button */}
                            <m.div
                                className='flex items-center justify-between pt-6'
                                {...fadeInUp(0.05, shouldReduceMotion)}
                            >
                                <form.Subscribe
                                    selector={(state) =>
                                        [
                                            canOpenPreview(state),
                                            state.isSubmitting,
                                            state.isValid,
                                        ] as const
                                    }
                                    children={([canOpen, isSubmitting, isValid]) => (
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
                                                disabled={!canOpen}
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
                            </m.div>
                        </form>
                    </ErrorBoundary>
                </div>

                {showPanel && (
                    <LivePreviewPanel preview={livePreview} unavailableAction={openPreviewButton} />
                )}
            </div>

            {!isWide && (
                <LivePreviewSheet
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    preview={livePreview}
                    unavailableAction={openPreviewButton}
                />
            )}
        </div>
    );
};

export default BuilderPage;
