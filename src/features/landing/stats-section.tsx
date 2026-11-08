import { m, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { fadeInScale } from '@/lib/animation-variants';
import { TEMPLATE_IDS } from '@/lib/template-ids';

export const StatsSection = () => {
    const { t } = useTranslation();
    const shouldReduceMotion = useReducedMotion();

    const stats = [
        { value: String(TEMPLATE_IDS.length), label: t('home.stats.templatesLabel') },
        { value: t('home.stats.freeForever'), label: t('home.stats.freeForeverLabel') },
        { value: t('home.stats.languages'), label: t('home.stats.languagesLabel') },
    ];

    return (
        <section className='bg-landing-bg-2 px-6 py-[140px]'>
            <div className='mx-auto grid max-w-[1000px] grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-12 text-center'>
                {stats.map(({ value, label }, i) => (
                    <m.div key={label} {...fadeInScale(i * 0.1, shouldReduceMotion)}>
                        <p className='text-[clamp(56px,7vw,88px)] leading-none font-bold tracking-[-0.05em]'>
                            {value}
                        </p>
                        <p className='text-landing-fg-2 mt-2.5 text-[17px]'>{label}</p>
                    </m.div>
                ))}
            </div>
        </section>
    );
};
