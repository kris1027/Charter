import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';
import { dismiss, notify } from '@/components/ui/toast';

const TOAST_ID = 'offline';

export const OfflineIndicator = () => {
    const { t } = useTranslation();
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Dismissed only when the condition turns false, never in a cleanup (StrictMode safe)
    useEffect(() => {
        if (!isOffline) {
            dismiss(TOAST_ID);
            return;
        }
        notify({
            id: TOAST_ID,
            variant: 'warning',
            icon: WifiOff,
            title: t('pwa.offline'),
            duration: Infinity,
            dismissible: false,
        });
    }, [isOffline, t]);

    return null;
};
