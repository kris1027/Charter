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
                className='bg-muted text-foreground space-y-3 rounded-md border p-4 text-sm'
            >
                <p>{t('builder.livePreview.unavailable')}</p>
                {unavailableAction}
            </div>
        );
    }

    return <PreviewPages pdf={preview.pdf} renderFailed={preview.failed} />;
};

type LivePreviewTitleProps = { preview: LivePreview; titleId?: string };

export const LivePreviewTitle = ({ preview, titleId }: LivePreviewTitleProps) => {
    const { t } = useTranslation();

    return (
        <div className='flex items-baseline gap-3'>
            <h2 id={titleId} className='font-display text-lg font-semibold'>
                {t('builder.livePreview.title')}
            </h2>
            {preview.status === 'updating' && (
                <span className='text-muted-foreground text-xs'>
                    {t('builder.livePreview.updating')}
                </span>
            )}
        </div>
    );
};
