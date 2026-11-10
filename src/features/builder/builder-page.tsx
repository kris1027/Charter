import { PersonalInfoSection } from '@/features/builder/form-sections/personal-info-section';
import { ExperienceSection } from '@/features/builder/form-sections/experience-section';
import { EducationSection } from '@/features/builder/form-sections/education-section';
import { SkillsSection } from '@/features/builder/form-sections/skills-section';
import { LanguagesSection } from '@/features/builder/form-sections/languages-section';
import { InterestsSection } from '@/features/builder/form-sections/interests-section';
import { GdprConsentSection } from '@/features/builder/form-sections/gdpr-consent-section';
import { resumeFormOptions, useAppForm } from '@/features/builder/resume-form';
import { useDeferredValue, useState, useEffect, useRef } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { notify } from '@/components/ui/toast';
import { EMPTY_RESUME, loadStoredResume } from '@/features/resume/stored-resume';
import { usePdfImport } from '@/features/builder/use-pdf-import';
import { useResumeAutosave } from '@/features/builder/use-resume-autosave';
import { focusFirstInvalid } from '@/features/builder/focus-first-invalid';
import { useRevealFocusedField } from '@/features/builder/use-reveal-focused-field';
import { PreviewCvButton } from '@/features/builder/preview-cv-button';
import { SectionNav } from '@/features/builder/section-nav';
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

    // Read once per mount
    const [stored] = useState(loadStoredResume);
    const storedTemplateId = isTemplateId(stored?.templateId) ? stored.templateId : undefined;

    // The route drops an unknown templateId, so the URL template, when set, is a real one
    const activeTemplateId: TemplateId = search.templateId ?? storedTemplateId ?? 'developer';

    const [initialValues] = useState(() =>
        stored ? { ...stored, templateId: activeTemplateId } : emptyResumeFor(activeTemplateId),
    );

    // Live preview (spec 0009): a side panel from 1280px, a sheet below that
    const isWide = useMediaQuery(WIDE_PREVIEW_QUERY);
    const previewPanel = usePreviewOpen();
    const [sheetOpen, setSheetOpenState] = useState(false);
    const showPanel = isWide && previewPanel.open;

    // onSubmitInvalid reads these at call time, so it never depends on which options useAppForm
    // applied last (spec 0012, AC-24)
    const sheetOpenNow = useRef(false);
    const setSheetOpen = (open: boolean) => {
        sheetOpenNow.current = open;
        setSheetOpenState(open);
    };
    const isWideNow = () => window.matchMedia(WIDE_PREVIEW_QUERY).matches;

    // Set when a submit from the sheet fails: the sheet closes first, then focus goes to the field
    const focusInvalidOnSheetClose = useRef(false);

    // Focuses the first invalid field; with none to focus, says something still needs fixing
    // (spec 0012, AC-23, AC-25)
    const revealFirstInvalid = () => {
        if (focusFirstInvalid()) return;
        notify({
            id: 'builder-invalid',
            variant: 'destructive',
            title: t('builder.validation.fixErrorsUnknown'),
        });
    };

    const form = useAppForm({
        ...resumeFormOptions,
        defaultValues: initialValues,
        // Every attempt validates and reports, not only the first (spec 0012, AC-23)
        canSubmitWhenInvalid: true,
        onSubmit: async ({ value }) => {
            // Store data in localStorage for persistence, then preview whether or not it worked.
            // autosave is declared below because it needs form; submit only runs after render.
            autosave.save();

            // Navigate to preview page with templateId
            navigate({ to: '/preview', search: { templateId: value.templateId } });
        },
        onSubmitInvalid: () => {
            if (!isWideNow() && sheetOpenNow.current) {
                focusInvalidOnSheetClose.current = true;
                setSheetOpen(false);
                return;
            }
            // One frame, so the errors and their aria-invalid have rendered
            requestAnimationFrame(revealFirstInvalid);
        },
    });

    // Sync form templateId when URL parameter changes
    useEffect(() => {
        if (search.templateId && form.getFieldValue('templateId') !== search.templateId) {
            form.setFieldValue('templateId', search.templateId);
        }
    }, [search.templateId, form]);

    useRevealFocusedField();

    const autosave = useResumeAutosave(form);
    const pdfImport = usePdfImport({ form, activeTemplateId });

    const livePreview = useLivePreview({
        form,
        templateId: activeTemplateId,
        lang: normalizeLang(i18n.language),
        active: showPanel || (!isWide && sheetOpen),
    });
    const openPreviewButton = <OpenPreviewButton form={form} />;

    // Only once the sheet has let go of focus can the invalid field take it (AC-24)
    const handleSheetCloseAutoFocus = (event: Event) => {
        if (!focusInvalidOnSheetClose.current) return;
        focusInvalidOnSheetClose.current = false;
        event.preventDefault();
        revealFirstInvalid();
    };

    // The first paint holds the bars and personal info; the other sections follow in a deferred
    // render, which React splits into short tasks, so the page never blocks input for long
    // (spec 0012, AC-40)
    const showAllSections = useDeferredValue(true, false);

    // Manual save function
    const handleManualSave = () => autosave.save({ backup: true });

    // Reset form function — keeps backup intact for recovery
    const handleReset = () => {
        autosave.clear();
        // keepDefaultValues: useAppForm re-applies its options each render, and new defaults
        // would make it put the initial resume back
        form.reset(emptyResumeFor(activeTemplateId), { keepDefaultValues: true });
    };

    // No overflow class here or above, so the toolbar, strip and panel can stick (spec 0012, AC-1)
    return (
        <div data-builder-page className='bg-background min-h-screen pb-24 xl:pb-0'>
            <BuilderToolbar
                activeTemplateId={activeTemplateId}
                pdfImport={pdfImport}
                autosave={autosave}
                onSave={handleManualSave}
                onReset={handleReset}
                previewOpen={previewPanel.open}
                onTogglePreview={previewPanel.toggle}
                previewButton={<PreviewCvButton form={form} size='sm' />}
            />
            <SectionNav form={form} />

            <div
                className={`container mx-auto px-4 py-8 ${showPanel ? 'grid max-w-[1600px] grid-cols-2 items-start gap-8' : 'max-w-5xl'}`}
            >
                <div className='min-w-0'>
                    <ErrorBoundary>
                        <form
                            noValidate
                            onSubmit={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                form.handleSubmit();
                            }}
                            className='space-y-6'
                        >
                            <PersonalInfoSection form={form} />
                            {showAllSections && (
                                <>
                                    <ExperienceSection form={form} />
                                    <EducationSection form={form} />
                                    <SkillsSection form={form} />
                                    <LanguagesSection form={form} />
                                    <InterestsSection form={form} />
                                    <GdprConsentSection form={form} />
                                </>
                            )}

                            <div className='flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between'>
                                <form.Subscribe selector={(state) => state.isValid}>
                                    {(isValid) => (
                                        <p className='text-destructive text-sm font-medium'>
                                            {!isValid && t('builder.validation.fixErrors')}
                                        </p>
                                    )}
                                </form.Subscribe>
                                <PreviewCvButton form={form} size='lg' />
                            </div>
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
                    onCloseAutoFocus={handleSheetCloseAutoFocus}
                />
            )}
        </div>
    );
};

export default BuilderPage;
