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
    // Lets the page keep focus on an invalid field after a failed submit (spec 0012, AC-24)
    onCloseAutoFocus?: (event: Event) => void;
};

// Below 1280px: a floating Preview button and a full screen sheet with the same pages (spec 0009)
export const LivePreviewSheet = ({
    open,
    onOpenChange,
    preview,
    unavailableAction,
    onCloseAutoFocus,
}: LivePreviewSheetProps) => {
    const { t } = useTranslation();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                <Button
                    type='button'
                    size='lg'
                    variant='secondary'
                    className='shadow-overlay fixed right-6 bottom-6 z-20 rounded-full'
                >
                    <Eye aria-hidden='true' />
                    {t('builder.livePreview.open')}
                </Button>
            </SheetTrigger>
            <SheetContent
                closeLabel={t('builder.livePreview.close')}
                onCloseAutoFocus={onCloseAutoFocus}
            >
                <div className='border-b px-4 py-3 pr-14'>
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
