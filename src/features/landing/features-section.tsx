import { m, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
    AutosaveVisual,
    DarkModeVisual,
    I18nVisual,
    PdfVisual,
    PrivacyVisual,
    TemplatesVisual,
} from '@/features/landing/feature-visuals';
import { fadeInUp } from '@/lib/animation-variants';

const COLUMNS = 3;

const CARDS = [
    { key: 'templates', labelClassName: 'text-landing-blue', Visual: TemplatesVisual },
    { key: 'darkMode', labelClassName: 'text-landing-purple', Visual: DarkModeVisual },
    { key: 'pdf', labelClassName: 'text-landing-orange', Visual: PdfVisual },
    { key: 'i18n', labelClassName: 'text-landing-green', Visual: I18nVisual },
    { key: 'autosave', labelClassName: 'text-landing-yellow', Visual: AutosaveVisual },
    { key: 'privacy', labelClassName: 'text-landing-pink', Visual: PrivacyVisual },
] as const;

export const FeaturesSection = () => {
    const { t } = useTranslation();
    const shouldReduceMotion = useReducedMotion();

    return (
        <section className='bg-landing-showcase-bg text-landing-showcase-fg px-6 py-[120px]'>
            <div className='mx-auto max-w-[1100px]'>
                <m.h2
                    className='mb-14 text-[clamp(40px,5.5vw,72px)] leading-[1.04] font-bold tracking-[-0.04em]'
                    {...fadeInUp(0, shouldReduceMotion)}
                >
                    {t('home.features.showcaseTitle')}{' '}
                    <span className='text-landing-showcase-muted block'>
                        {t('home.features.showcaseHighlight')}
                    </span>
                </m.h2>
                <div className='grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5'>
                    {CARDS.map(({ key, labelClassName, Visual }, i) => (
                        <m.div
                            key={key}
                            className='bg-landing-showcase-card flex min-h-[440px] flex-col justify-between overflow-hidden rounded-[28px] p-9'
                            {...fadeInUp((i % COLUMNS) * 0.1, shouldReduceMotion)}
                        >
                            <div>
                                <h3 className={`mb-2 text-sm font-semibold ${labelClassName}`}>
                                    {t(`home.features.${key}.title`)}
                                </h3>
                                <p className='text-[28px] leading-[1.15] font-semibold tracking-[-0.02em]'>
                                    {t(`home.features.${key}.desc`)}
                                </p>
                            </div>
                            <Visual />
                        </m.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
