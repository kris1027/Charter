import type { RefObject } from 'react';
import { Link } from '@tanstack/react-router';
import { Download, Loader2, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import type { TemplateId } from '@/lib/template-ids';

type PreviewToolbarActions = {
    templateId: TemplateId;
    onDownload: () => void;
    isExporting: boolean;
    downloadRef: RefObject<HTMLButtonElement | null>;
};

// All of the actions or none of them. None in the empty state: only the title and the shell
// toggles (AC-25)
type PreviewToolbarProps =
    PreviewToolbarActions | Partial<Record<keyof PreviewToolbarActions, never>>;

// The 56px sticky bar (spec 0013, AC-3 to AC-6): the edit link and title on the left, then
// Download PDF and the shell toggles
export const PreviewToolbar = ({
    templateId,
    onDownload,
    isExporting = false,
    downloadRef,
}: PreviewToolbarProps) => {
    const hasActions = onDownload !== undefined;
    const { t } = useTranslation();

    return (
        <div className='bg-background sticky top-0 z-10 h-14 border-b'>
            <div className='mx-auto flex h-full max-w-6xl items-center gap-2 px-4'>
                {hasActions && (
                    <Button asChild variant='ghost' size='sm' className='-ml-2.5'>
                        <Link
                            to='/builder'
                            search={{ templateId }}
                            aria-label={t('preview.editCv')}
                        >
                            <Pencil aria-hidden='true' />
                            <span className='hidden sm:inline'>{t('preview.editCv')}</span>
                        </Link>
                    </Button>
                )}
                <h1
                    className={`font-display truncate text-lg font-semibold ${
                        // With no actions the title is the only thing on the left, so it always shows
                        hasActions ? 'sr-only md:not-sr-only' : ''
                    }`}
                >
                    {t('preview.title')}
                </h1>

                <div className='ml-auto flex shrink-0 items-center gap-2'>
                    {hasActions && (
                        <Button
                            ref={downloadRef}
                            type='button'
                            size='sm'
                            onClick={onDownload}
                            disabled={isExporting}
                            aria-busy={isExporting || undefined}
                            aria-label={t('preview.downloadPdf')}
                            // The Lighthouse seed script waits for this (spec 0003)
                            data-testid='export-pdf'
                        >
                            {isExporting ? (
                                <Loader2 aria-hidden='true' className='animate-spin' />
                            ) : (
                                <Download aria-hidden='true' />
                            )}
                            <span className='hidden sm:inline'>{t('preview.downloadPdf')}</span>
                        </Button>
                    )}
                    <LanguageToggle />
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );
};
