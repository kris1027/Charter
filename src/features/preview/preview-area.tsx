import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PreviewPages } from '@/features/pdf/live-preview/preview-pages';
import {
    PAGE_ASPECT_CLASS,
    PAGE_MAX_WIDTH_CLASS,
    PAGE_SHEET_CLASS,
    WARNING_NOTICE_CLASS,
} from '@/features/pdf/live-preview/preview-styles';
import type { PreviewStatus } from '@/features/preview/use-preview-document';

type PreviewAreaProps = {
    status: PreviewStatus;
    // The kept bytes for the selected mode; null keeps the pages already drawn
    pdf: ArrayBuffer | null;
    onRetry: () => void;
};

// The muted area under the bars (spec 0013): the loading sheet, the unavailable notice, the
// failure notice with Try again, or the drawn pages (AC-9, AC-10, AC-22, AC-23). It owns every
// notice, so PreviewPages draws with its own notices off. A render the worker finished but the
// canvas could not draw counts as a failure too, so the page never waits on the loading sheet
export const PreviewArea = ({ status, pdf, onRetry }: PreviewAreaProps) => {
    const { t } = useTranslation();
    const [isDrawn, setIsDrawn] = useState(false);
    const [drawFailed, setDrawFailed] = useState(false);

    // Pages already on screen stay when the worker goes away, even in the window after a
    // language change, when the kept bytes are cleared but the old pages are still drawn (AC-22)
    const isUnavailable = status === 'unavailable' && !pdf && !isDrawn;
    const isFailed = status === 'failed' || drawFailed;
    const isLoading = !isDrawn && !isUnavailable && !isFailed;

    return (
        <div className='bg-muted relative flex-1 px-4 pt-6 pb-16 md:pt-8 md:pb-20'>
            {/* Sits in the top padding, so the sheet below starts where the first page will */}
            {isLoading && (
                <p
                    role='status'
                    className='text-muted-foreground absolute inset-x-4 top-0 truncate text-center text-xs leading-6 md:leading-8'
                >
                    {t('pdfPreview.preparing')}
                </p>
            )}
            <div className={`mx-auto space-y-4 ${PAGE_MAX_WIDTH_CLASS}`}>
                {isUnavailable && (
                    <p
                        role='status'
                        className='bg-background text-foreground rounded-md border p-4 text-sm'
                    >
                        {t('preview.unavailable')}
                    </p>
                )}
                {isFailed && (
                    <div
                        role='status'
                        className={`${WARNING_NOTICE_CLASS} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}
                    >
                        <p>{t('preview.renderFailed')}</p>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => {
                                setDrawFailed(false);
                                onRetry();
                            }}
                        >
                            {t('preview.retry')}
                        </Button>
                    </div>
                )}
                {/* One grid cell holds the sheet and the pages, so the first page lands on top of
                    the sheet and nothing moves when the sheet leaves a frame later (AC-10) */}
                {!isUnavailable && (
                    <div className='grid grid-cols-1'>
                        {isLoading && (
                            <div
                                data-loading-sheet
                                className={`col-start-1 row-start-1 w-full self-start ${PAGE_ASPECT_CLASS} ${PAGE_MAX_WIDTH_CLASS} ${PAGE_SHEET_CLASS}`}
                            />
                        )}
                        <div className='col-start-1 row-start-1'>
                            <PreviewPages
                                pdf={pdf}
                                showNotices={false}
                                onPageCount={(count) => {
                                    setIsDrawn(count > 0);
                                    if (count > 0) setDrawFailed(false);
                                }}
                                onDrawFailed={() => setDrawFailed(true)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
