import { FileWarning } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ExportErrorDialogProps = {
    open: boolean;
    onClose: () => void;
    // Where focus goes when the dialog closes: Download PDF (AC-24)
    onCloseAutoFocus: (event: Event) => void;
};

// Opens when the fallback export fails (spec 0013, AC-24)
export const ExportErrorDialog = ({ open, onClose, onCloseAutoFocus }: ExportErrorDialogProps) => {
    const { t } = useTranslation();

    return (
        <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
            <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
                <AlertDialogHeader>
                    <div className='flex items-center gap-3'>
                        <div className='bg-warning/10 text-warning flex size-10 shrink-0 items-center justify-center rounded-full'>
                            <FileWarning aria-hidden='true' className='size-5' />
                        </div>
                        <AlertDialogTitle>{t('preview.exportErrorTitle')}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className='pt-2'>
                        {t('preview.exportError')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {/* The outline close button: Download PDF stays the only default button (AC-6) */}
                    <AlertDialogCancel>{t('dialogs.pdfError.ok')}</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
