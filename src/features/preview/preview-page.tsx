import { useEffect, useState } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Edit, Loader2, FileWarning, FileText, Files } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import {
    exportToPDF,
    countPdfPages,
    generateResumeFilename,
    renderResumePdf,
} from '@/features/pdf/pdf-export';
import { TEMPLATE_IDS } from '@/lib/template-ids';
import type { TemplateId } from '@/lib/template-ids';
import { useTranslation } from 'react-i18next';
import { normalizeLang } from '@/lib/app-lang';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { loadStoredResume } from '@/features/resume/stored-resume';
import { LazyTemplateViewer } from '@/features/templates/pdf/lazy-template-viewer';

// Binary search: find the minimum compactScale (0–1) that makes the PDF fit on one page.
// Returns null when content can't fit even at maximum compaction.
async function findMinCompactScale(
    pdfFn: (scale: number) => Promise<Blob>,
): Promise<number | null> {
    const maxBlob = await pdfFn(1);
    if ((await countPdfPages(maxBlob)) > 1) return null;

    let lo = 0;
    let hi = 1;
    // 6 iterations → precision of 1/64 ≈ 1.5%
    for (let i = 0; i < 6; i++) {
        const mid = (lo + hi) / 2;
        const blob = await pdfFn(mid);
        const pages = await countPdfPages(blob);
        if (pages <= 1) {
            hi = mid;
        } else {
            lo = mid;
        }
    }
    return hi;
}

export const PreviewPage = () => {
    const { t, i18n } = useTranslation();
    const search = useSearch({ from: '/preview' }) as { templateId?: string };
    const rawTemplateId = search.templateId;
    const templateId: TemplateId = TEMPLATE_IDS.includes(rawTemplateId as TemplateId)
        ? (rawTemplateId as TemplateId)
        : 'developer';
    const lang = normalizeLang(i18n.language);

    const [resumeData] = useState(loadStoredResume);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [isMultiPage, setIsMultiPage] = useState(false);
    // null = searching, number = found scale, 'cannot-fit' = even max compaction overflows
    const [optimalScale, setOptimalScale] = useState<number | 'cannot-fit' | null>(null);
    const [useCompact, setUseCompact] = useState(false);
    const [isPreviewReady, setIsPreviewReady] = useState(false);

    // Reset all compact-related state during render so stale values don't linger if templateId changes
    const fitKey = `${templateId}:${lang}`;
    const [prevFitKey, setPrevFitKey] = useState(fitKey);
    if (fitKey !== prevFitKey) {
        setPrevFitKey(fitKey);
        setIsPreviewReady(false);
        setIsMultiPage(false);
        setOptimalScale(null);
        setUseCompact(false);
    }

    // Detect page count, then binary-search for optimal compact scale in background
    useEffect(() => {
        if (!resumeData) return;

        let cancelled = false;

        async function run() {
            const normalBlob = await renderResumePdf({
                data: resumeData!,
                templateId,
                compactScale: 0,
                lang,
            });
            if (cancelled) return;

            const pages = await countPdfPages(normalBlob);
            if (pages <= 1) {
                setIsPreviewReady(true);
                return;
            }

            setIsMultiPage(true);

            const scale = await findMinCompactScale((s) =>
                renderResumePdf({ data: resumeData!, templateId, compactScale: s, lang }),
            );
            if (!cancelled) {
                setOptimalScale(scale === null ? 'cannot-fit' : scale);
                setIsPreviewReady(true);
            }
        }

        run().catch((err) => {
            if (import.meta.env.DEV) console.error('Failed to detect PDF page count:', err);
            if (!cancelled) setIsPreviewReady(true);
        });

        return () => {
            cancelled = true;
        };
    }, [resumeData, templateId, lang]);

    const handleDownloadPDF = async () => {
        if (!resumeData) return;
        setIsExporting(true);
        try {
            const filename = generateResumeFilename(
                resumeData.personalInfo?.firstName,
                resumeData.personalInfo?.lastName,
            );
            const compactScale = useCompact && typeof optimalScale === 'number' ? optimalScale : 0;
            await exportToPDF(resumeData, templateId, {
                filename,
                compactScale,
                lang: i18n.language,
            });
        } catch (error) {
            if (import.meta.env.DEV) console.error('Failed to export PDF:', error);
            setExportError(t('preview.exportError'));
        } finally {
            setIsExporting(false);
        }
    };

    const activeScale = useCompact && typeof optimalScale === 'number' ? optimalScale : 0;
    const previewPlaceholder = (
        <div className='flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950'>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
                {t('preview.loadingPreview')}
            </p>
        </div>
    );
    // Hide toggle entirely when content can't fit even at max compaction
    const showToggle = isPreviewReady && isMultiPage && optimalScale !== 'cannot-fit';

    if (!resumeData) {
        return (
            <div className='relative min-h-screen overflow-hidden'>
                <div className='animate-gradient-shift absolute inset-0 bg-linear-to-br from-indigo-50 via-white to-violet-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/80' />
                <div
                    className='absolute inset-0 opacity-[0.03] dark:opacity-[0.04]'
                    style={{
                        backgroundImage:
                            'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />
                <div className='relative z-1 container mx-auto px-4 py-24'>
                    <div className='animate-fade-in-up mx-auto max-w-md text-center'>
                        <h1 className='font-display mb-4 text-2xl font-bold dark:text-gray-100'>
                            {t('preview.noData')}
                        </h1>
                        <p className='text-muted-foreground mb-6'>{t('preview.noDataHint')}</p>
                        <Button
                            asChild
                            className='bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-lg transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl'
                        >
                            <Link to='/templates'>
                                <ArrowLeft className='mr-2 h-4 w-4' />
                                {t('preview.startBuilding')}
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='flex h-screen flex-col overflow-hidden'>
            {/* Navbar */}
            <div className='shrink-0 border-b border-white/20 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80'>
                <div className='container mx-auto px-4 py-4'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            <Button asChild variant='outline' size='sm'>
                                <Link to='/builder' search={{ templateId }}>
                                    <ArrowLeft className='mr-2 h-4 w-4' />
                                    {t('nav.backToEditor')}
                                </Link>
                            </Button>
                            <h1 className='font-display bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400'>
                                {t('preview.title')}
                            </h1>
                        </div>

                        <div className='flex items-center gap-3'>
                            <div className='flex min-h-8 items-center justify-end md:min-w-47.5'>
                                {/* Page layout toggle — visible only when content exceeds one page and can be compacted */}
                                {showToggle && (
                                    <div className='flex items-center overflow-hidden rounded-md border border-gray-200 dark:border-gray-700'>
                                        <button
                                            type='button'
                                            aria-pressed={!useCompact}
                                            onClick={() => setUseCompact(false)}
                                            className={`flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                                                !useCompact
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <Files className='h-3.5 w-3.5' />
                                            {t('preview.multiPage')}
                                        </button>
                                        <button
                                            type='button'
                                            aria-pressed={useCompact}
                                            onClick={() => setUseCompact(true)}
                                            className={`flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                                                useCompact
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <FileText className='h-3.5 w-3.5' />
                                            {t('preview.singlePage')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <Button
                                variant='outline'
                                size='sm'
                                onClick={handleDownloadPDF}
                                disabled={isExporting}
                                // The Lighthouse seed script waits for this (spec 0003)
                                data-testid='export-pdf'
                                className='transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400'
                            >
                                {isExporting ? (
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                ) : (
                                    <Download className='mr-2 h-4 w-4' />
                                )}
                                {isExporting ? t('preview.exporting') : t('preview.downloadPdf')}
                            </Button>
                            <Button
                                asChild
                                size='sm'
                                className='bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-sm transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-md'
                            >
                                <Link to='/builder' search={{ templateId }}>
                                    <Edit className='mr-2 h-4 w-4' />
                                    {t('preview.editCv')}
                                </Link>
                            </Button>
                            <LanguageToggle />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Preview */}
            <div className='min-h-0 flex-1'>
                {isPreviewReady ? (
                    <LazyTemplateViewer
                        data={resumeData}
                        templateId={templateId}
                        compactScale={activeScale}
                        lang={lang}
                        fallback={previewPlaceholder}
                    />
                ) : (
                    previewPlaceholder
                )}
            </div>

            {/* Export Error Dialog */}
            <AlertDialog
                open={!!exportError}
                onOpenChange={(open) => !open && setExportError(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30'>
                                <FileWarning className='h-5 w-5 text-orange-600 dark:text-orange-400' />
                            </div>
                            <AlertDialogTitle>{t('preview.exportErrorTitle')}</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className='pt-2'>
                            {exportError}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setExportError(null)}>
                            {t('dialogs.pdfError.ok')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
