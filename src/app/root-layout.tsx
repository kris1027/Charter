import { HeadContent, Outlet, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Toaster } from '@/components/ui/toast';
import { PrivacyNotice } from '@/app/privacy-notice';
import { PwaReloadPrompt } from '@/app/pwa-reload-prompt';
import { PwaInstallPrompt } from '@/app/pwa-install-prompt';
import { OfflineIndicator } from '@/app/offline-indicator';
import { MotionProvider } from '@/app/motion-provider';
import { useTranslation } from 'react-i18next';

export const RootLayout = () => {
    const { t, i18n } = useTranslation();
    const router = useRouter();

    // Route titles come from `head`, which runs on navigation; a language change reruns it so the
    // tab title follows the language (WCAG 2.4.2, spec 0014)
    useEffect(() => {
        const handleLanguageChanged = () => void router.invalidate();
        i18n.on('languageChanged', handleLanguageChanged);
        return () => i18n.off('languageChanged', handleLanguageChanged);
    }, [i18n, router]);

    return (
        <>
            <HeadContent />
            <ThemeProvider defaultTheme='system'>
                <a
                    href='#main-content'
                    className='focus:bg-background focus:text-foreground focus:shadow-overlay sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2'
                >
                    {t('accessibility.skipToContent')}
                </a>
                <div className='bg-background text-foreground min-h-screen transition-colors'>
                    <main id='main-content' className='flex-1'>
                        <ErrorBoundary>
                            <MotionProvider>
                                <Outlet />
                            </MotionProvider>
                        </ErrorBoundary>
                    </main>
                </div>
                {/* Before the notices: sibling effects run in tree order, so Sonner subscribes first */}
                <Toaster />
                <OfflineIndicator />
                <PrivacyNotice />
                <PwaInstallPrompt />
                <PwaReloadPrompt />
            </ThemeProvider>
        </>
    );
};
