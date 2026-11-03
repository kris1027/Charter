import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileWarning } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type PdfErrorDialogProps = {
    error: string | null;
    onClose: () => void;
};

export const PdfErrorDialog = ({ error, onClose }: PdfErrorDialogProps) => {
    const { t } = useTranslation();

    return (
        <AlertDialog open={!!error} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30'>
                            <FileWarning className='h-5 w-5 text-orange-600 dark:text-orange-400' />
                        </div>
                        <AlertDialogTitle>{t('dialogs.pdfError.title')}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className='pt-2'>{error}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={onClose}>
                        {t('dialogs.pdfError.ok')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
