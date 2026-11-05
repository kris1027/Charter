import type { ReactNode } from 'react';
import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { LivePreview } from '@/features/builder/live-preview/use-live-preview';
import {
    LivePreviewBody,
    LivePreviewTitle,
} from '@/features/builder/live-preview/live-preview-body';

type LivePreviewSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    preview: LivePreview;
    unavailableAction: ReactNode;
};

// Below 1280px: a floating Preview button and a full screen sheet with the same pages (spec 0009)
export const LivePreviewSheet = ({
    open,
    onOpenChange,
    preview,
    unavailableAction,
}: LivePreviewSheetProps) => {
    const { t } = useTranslation();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                <Button
                    type='button'
                    size='lg'
                    className='fixed right-6 bottom-6 z-20 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:from-indigo-700 hover:to-violet-700'
                >
                    <Eye className='mr-2 h-4 w-4' />
                    {t('builder.livePreview.open')}
                </Button>
            </SheetTrigger>
            <SheetContent closeLabel={t('builder.livePreview.close')}>
                <div className='border-b border-slate-200 px-4 py-3 pr-14 dark:border-white/10'>
                    <SheetTitle asChild>
                        <div>
                            <LivePreviewTitle preview={preview} />
                        </div>
                    </SheetTitle>
                </div>
                <div className='min-h-0 flex-1 overflow-y-auto p-4'>
                    <LivePreviewBody preview={preview} unavailableAction={unavailableAction} />
                </div>
            </SheetContent>
        </Sheet>
    );
};
