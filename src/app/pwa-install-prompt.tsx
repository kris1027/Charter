import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { dismiss, notify } from '@/components/ui/toast';
import { safeStorage } from '@/lib/storage';

const STORAGE_KEY = 'pwaInstallDismissed';
const TOAST_ID = 'pwa-install';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export const PwaInstallPrompt = () => {
    const { t } = useTranslation();
    const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        if (safeStorage.getItem(STORAGE_KEY)) return;

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setPromptEvent(e as BeforeInstallPromptEvent);
        };
        const handleAppInstalled = () => setPromptEvent(null);

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // Dismissed only when the condition turns false, never in a cleanup (StrictMode safe)
    useEffect(() => {
        if (!promptEvent) {
            dismiss(TOAST_ID);
            return;
        }
        // Closes whatever the user picks in the browser prompt, without saving the flag
        const handleInstall = async () => {
            try {
                await promptEvent.prompt();
            } finally {
                setPromptEvent(null);
            }
        };
        const handleClose = () => {
            safeStorage.setItem(STORAGE_KEY, 'true');
            setPromptEvent(null);
        };
        notify({
            id: TOAST_ID,
            variant: 'info',
            icon: Download,
            title: t('pwa.install'),
            description: t('pwa.installDescription'),
            duration: Infinity,
            dismissible: false,
            actions: [
                { label: t('pwa.installButton'), kind: 'primary', onClick: handleInstall },
                { label: t('pwa.close'), kind: 'secondary', onClick: handleClose },
            ],
        });
    }, [promptEvent, t]);

    return null;
};
