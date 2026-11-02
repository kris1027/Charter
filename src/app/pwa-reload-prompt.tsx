import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { useNotice } from '@/hooks/use-notice';

export const PwaReloadPrompt = () => {
    const { t } = useTranslation();
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW();

    useNotice(
        'pwa-update',
        needRefresh
            ? {
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
                      {
                          label: t('pwa.close'),
                          kind: 'secondary',
                          onClick: () => setNeedRefresh(false),
                      },
                  ],
              }
            : null,
    );

    useNotice(
        'pwa-offline-ready',
        offlineReady
            ? {
                  variant: 'success',
                  icon: RefreshCw,
                  title: t('pwa.offlineReady'),
                  duration: 5000,
                  onAutoClose: () => setOfflineReady(false),
                  onDismiss: () => setOfflineReady(false),
              }
            : null,
    );

    return null;
};
