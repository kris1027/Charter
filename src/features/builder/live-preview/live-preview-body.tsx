import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { LivePreview } from '@/features/builder/live-preview/use-live-preview';
import { PreviewPages } from '@/features/builder/live-preview/preview-pages';

type LivePreviewBodyProps = {
    preview: LivePreview;
    // The Open preview button, shown when the worker cannot run here
    unavailableAction: ReactNode;
};

// What the side panel and the narrow screen sheet both show: notices and the drawn pages
export const LivePreviewBody = ({ preview, unavailableAction }: LivePreviewBodyProps) => {
    const { t } = useTranslation();

    if (preview.status === 'unavailable') {
        return (
            <div
                role='status'
                className='space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
            >
                <p>{t('builder.livePreview.unavailable')}</p>
                {unavailableAction}
            </div>
        );
    }

    return <PreviewPages pdf={preview.pdf} renderFailed={preview.failed} />;
};

type LivePreviewHeaderProps = { preview: LivePreview; titleId?: string };

export const LivePreviewTitle = ({ preview, titleId }: LivePreviewHeaderProps) => {
    const { t } = useTranslation();

    return (
        <div className='flex items-baseline gap-3'>
            <h2
                id={titleId}
                className='font-display text-lg font-semibold text-slate-900 dark:text-slate-100'
            >
                {t('builder.livePreview.title')}
            </h2>
            {preview.status === 'updating' && (
                <span className='text-xs text-slate-500 dark:text-slate-400'>
                    {t('builder.livePreview.updating')}
                </span>
            )}
        </div>
    );
};
