import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { dismiss, notify } from '@/components/ui/toast';

const UPDATE_ID = 'pwa-update';
const OFFLINE_READY_ID = 'pwa-offline-ready';

// Each toast is dismissed only when its condition turns false, never in a cleanup (StrictMode safe)
export const PwaReloadPrompt = () => {
    const { t } = useTranslation();
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW();

    useEffect(() => {
        if (!needRefresh) {
            dismiss(UPDATE_ID);
            return;
        }
        notify({
            id: UPDATE_ID,
            variant: 'info',
            icon: RefreshCw,
            title: t('pwa.newContent'),
            duration: Infinity,
            dismissible: false,
            actions: [
                {
                    label: t('pwa.reload'),
                    kind: 'primary',
                    onClick: () => updateServiceWorker(true),
                },
                { label: t('pwa.close'), kind: 'secondary', onClick: () => setNeedRefresh(false) },
            ],
        });
    }, [needRefresh, setNeedRefresh, updateServiceWorker, t]);

    useEffect(() => {
        if (!offlineReady) {
            dismiss(OFFLINE_READY_ID);
            return;
        }
        notify({
            id: OFFLINE_READY_ID,
            variant: 'success',
            icon: RefreshCw,
            title: t('pwa.offlineReady'),
            duration: 5000,
            onAutoClose: () => setOfflineReady(false),
            onDismiss: () => setOfflineReady(false),
        });
    }, [offlineReady, setOfflineReady, t]);

    return null;
};
