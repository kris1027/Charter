import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ResetDialogProps = {
    onConfirm: () => void;
};

// The Reset button and the dialog that confirms it
export const ResetDialog = ({ onConfirm }: ResetDialogProps) => {
    const { t } = useTranslation();

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                >
                    <RotateCcw className='mr-2 h-4 w-4' />
                    {t('builder.reset')}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
                            <AlertTriangle className='h-5 w-5 text-red-600 dark:text-red-400' />
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
                        className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
                    >
                        {t('dialogs.reset.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
