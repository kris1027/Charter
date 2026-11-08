import { m, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { LandingCtaLink } from '@/features/landing/landing-cta-link';
import { fadeInUp } from '@/lib/animation-variants';

export const ClosingSection = () => {
    const { t } = useTranslation();
    const shouldReduceMotion = useReducedMotion();

    return (
        <section className='bg-landing-bg px-6 pt-[180px] pb-[200px] text-center'>
            <m.div {...fadeInUp(0, shouldReduceMotion)}>
                <h2 className='text-[clamp(44px,6.5vw,80px)] leading-[1.03] font-bold tracking-[-0.045em] text-balance'>
                    {t('home.cta.title')}
                </h2>
                <p className='text-landing-fg-2 mx-auto mt-5 max-w-[560px] text-[21px] leading-[1.4]'>
                    {t('home.cta.subtitle')}
                </p>
                <div className='mt-9 flex justify-center'>
                    <LandingCtaLink className='px-7 py-3.5'>{t('home.cta.button')}</LandingCtaLink>
                </div>
            </m.div>
        </section>
    );
};
