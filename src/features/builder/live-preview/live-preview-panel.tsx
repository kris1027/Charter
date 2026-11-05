import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { LivePreview } from '@/features/builder/live-preview/use-live-preview';
import {
    LivePreviewBody,
    LivePreviewTitle,
} from '@/features/builder/live-preview/live-preview-body';

// The panel shows from Tailwind's `xl` (1280px); the toolbar toggle's `xl:` class must match
export const WIDE_PREVIEW_QUERY = '(min-width: 1280px)';

type LivePreviewPanelProps = {
    preview: LivePreview;
    unavailableAction: ReactNode;
};

// The wide screen panel beside the form: sticky below the toolbar, scrolling inside (spec 0009)
export const LivePreviewPanel = ({ preview, unavailableAction }: LivePreviewPanelProps) => {
    const { t } = useTranslation();

    return (
        <aside
            aria-label={t('builder.livePreview.title')}
            // Strict containment keeps a page swap from laying out the long form beside it; no
            // backdrop blur, which would repaint behind every redraw
            className='sticky top-24 h-[calc(100vh-7rem)] space-y-3 overflow-y-auto rounded-2xl border border-slate-200/60 bg-white/90 p-4 [contain:strict] dark:border-white/5 dark:bg-slate-900/90'
        >
            <LivePreviewTitle preview={preview} />
            <LivePreviewBody preview={preview} unavailableAction={unavailableAction} />
        </aside>
    );
};
