import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/lib/button-variants';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ResetDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    // The actions menu sends focus back to its trigger, since the dialog has no trigger of its own
    onCloseAutoFocus: (event: Event) => void;
};

// Confirms Reset; opened from the actions menu and rendered outside it (spec 0012, AC-8)
export const ResetDialog = ({
    open,
    onOpenChange,
    onConfirm,
    onCloseAutoFocus,
}: ResetDialogProps) => {
    const { t } = useTranslation();

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
                <AlertDialogHeader>
                    <div className='flex items-center gap-3'>
                        <div
                            className='bg-destructive/10 text-destructive flex size-10 shrink-0 items-center justify-center rounded-full'
                            aria-hidden='true'
                        >
                            <AlertTriangle className='size-5' />
                        </div>
                        <AlertDialogTitle>{t('dialogs.reset.title')}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className='pt-2'>
                        {t('dialogs.reset.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('dialogs.reset.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={buttonVariants({ variant: 'destructive' })}
                    >
                        {t('dialogs.reset.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
