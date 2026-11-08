import { m, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { fadeInUp } from '@/lib/animation-variants';
import { SEO_DEFAULTS } from '@/lib/seo';

export const LandingFooter = () => {
    const { t } = useTranslation();
    const shouldReduceMotion = useReducedMotion();

    return (
        <footer className='border-landing-line bg-landing-bg-2 text-landing-fg-2 border-t px-6 py-5 text-center text-xs'>
            <m.p {...fadeInUp(0, shouldReduceMotion)}>
                {SEO_DEFAULTS.siteName} · {t('home.footer.privacy')}
            </m.p>
        </footer>
    );
};
