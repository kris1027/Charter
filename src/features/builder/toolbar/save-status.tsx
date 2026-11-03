import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SaveStatusProps = {
    saveError: boolean;
    lastSaved: Date | null;
    isAutoSaved: boolean;
};

export const SaveStatus = ({ saveError, lastSaved, isAutoSaved }: SaveStatusProps) => {
    const { t } = useTranslation();

    if (saveError) {
        return (
            <div
                className='flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400'
                role='alert'
            >
                <AlertTriangle className='h-4 w-4' />
                <span className='hidden sm:inline'>{t('builder.saveFailed')}</span>
            </div>
        );
    }

    if (!lastSaved) return null;

    return (
        <div className='flex items-center gap-2 text-sm text-green-600 dark:text-green-400'>
            <CheckCircle className='h-4 w-4' />
            <span className='hidden sm:inline'>
                {t(isAutoSaved ? 'builder.autoSaved' : 'builder.saved', {
                    time: lastSaved.toLocaleTimeString(),
                })}
            </span>
        </div>
    );
};
