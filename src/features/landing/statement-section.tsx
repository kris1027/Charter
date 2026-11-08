import { m, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { fadeInUp } from '@/lib/animation-variants';

export const StatementSection = () => {
    const { t } = useTranslation();
    const shouldReduceMotion = useReducedMotion();

    return (
        <section className='bg-landing-bg px-6 py-[18vh]'>
            <m.p
                className='mx-auto max-w-[980px] text-center text-[clamp(32px,5vw,64px)] leading-[1.08] font-semibold tracking-[-0.035em] text-balance'
                {...fadeInUp(0, shouldReduceMotion)}
            >
                {t('home.features.title')}{' '}
                <span className='text-landing-muted'>{t('home.features.subtitle')}</span>
            </m.p>
        </section>
    );
};
