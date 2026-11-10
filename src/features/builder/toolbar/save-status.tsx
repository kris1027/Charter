import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SaveStatusProps = {
    isImporting: boolean;
    saveError: boolean;
    lastSaved: Date | null;
    isAutoSaved: boolean;
};

// Below sm only the icon shows; the text stays for screen readers
const TEXT_CLASS = 'sr-only sm:not-sr-only sm:whitespace-nowrap';

// One spot for import, save failure and the saved time, in that order (spec 0012, AC-9). Import
// and a manual save speak through the always mounted status element; autosave stays out of it,
// so the 30 second tick never interrupts
export const SaveStatus = ({ isImporting, saveError, lastSaved, isAutoSaved }: SaveStatusProps) => {
    const { t } = useTranslation();
    const time = lastSaved?.toLocaleTimeString();
    const showManualSave = !isImporting && !saveError && lastSaved && !isAutoSaved;
    const showAutoSave = !isImporting && !saveError && lastSaved && isAutoSaved;

    return (
        <div className='flex min-w-0 items-center text-sm'>
            <div role='status' className='flex items-center gap-2'>
                {isImporting && (
                    <span className='text-muted-foreground flex items-center gap-2'>
                        <Loader2 className='size-4 motion-safe:animate-spin' aria-hidden='true' />
                        <span className={TEXT_CLASS}>{t('builder.loading')}</span>
                    </span>
                )}
                {showManualSave && (
                    <span className='text-success flex items-center gap-2'>
                        <CheckCircle className='size-4' aria-hidden='true' />
                        <span className={TEXT_CLASS}>{t('builder.saved', { time })}</span>
                    </span>
                )}
            </div>
            {!isImporting && saveError && (
                <div className='text-warning flex items-center gap-2' role='alert'>
                    <AlertTriangle className='size-4' aria-hidden='true' />
                    <span className={TEXT_CLASS}>{t('builder.saveFailed')}</span>
                </div>
            )}
            {showAutoSave && (
                <div className='text-success flex items-center gap-2'>
                    <CheckCircle className='size-4' aria-hidden='true' />
                    <span className={TEXT_CLASS}>{t('builder.autoSaved', { time })}</span>
                </div>
            )}
        </div>
    );
};
