import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import { dismiss, notify } from '@/components/ui/toast';
import { safeStorage } from '@/lib/storage';

const STORAGE_KEY = 'privacyNoticeAccepted';
const TOAST_ID = 'privacy';

export const PrivacyNotice = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(() => !safeStorage.getItem(STORAGE_KEY));

    // No close button, no swipe, no timeout: Accept is the only way out
    useEffect(() => {
        if (!isVisible) {
            dismiss(TOAST_ID);
            return;
        }
        const handleAccept = () => {
            safeStorage.setItem(STORAGE_KEY, 'true');
            setIsVisible(false);
        };
        notify({
            id: TOAST_ID,
            variant: 'info',
            icon: Shield,
            title: t('privacy.notice'),
            description: t('privacy.details'),
            duration: Infinity,
            dismissible: false,
            actions: [{ label: t('privacy.accept'), kind: 'primary', onClick: handleAccept }],
        });
    }, [isVisible, t]);

    return null;
};
