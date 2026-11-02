import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import { useNotice } from '@/hooks/use-notice';
import { safeStorage } from '@/lib/storage';

const STORAGE_KEY = 'privacyNoticeAccepted';

export const PrivacyNotice = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(() => !safeStorage.getItem(STORAGE_KEY));

    const handleAccept = () => {
        safeStorage.setItem(STORAGE_KEY, 'true');
        setIsVisible(false);
    };

    // No close button, no swipe, no timeout: Accept is the only way out
    useNotice(
        'privacy',
        isVisible
            ? {
                  variant: 'info',
                  icon: Shield,
                  title: t('privacy.notice'),
                  description: t('privacy.details'),
                  duration: Infinity,
                  dismissible: false,
                  actions: [{ label: t('privacy.accept'), kind: 'primary', onClick: handleAccept }],
              }
            : null,
    );

    return null;
};
