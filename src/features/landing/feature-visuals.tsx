import type { ReactNode } from 'react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useLandingParallax } from '@/features/landing/use-scroll-effects';

type ParallaxSheetProps = {
    yRange: number;
    rotate?: number;
    className: string;
    children?: ReactNode;
};

const ParallaxSheet = ({ yRange, rotate = 0, className, children }: ParallaxSheetProps) => {
    const { ref, y } = useLandingParallax(yRange);
    return (
        <m.div
            ref={ref}
            className={`absolute aspect-[0.72] w-[34%] rounded-[10px] ${className}`}
            style={{ rotate, y }}
        >
            {children}
        </m.div>
    );
};

export const TemplatesVisual = () => (
    <div className='relative h-[170px]' aria-hidden='true'>
        <ParallaxSheet
            yRange={-40}
            rotate={-10}
            className='bg-landing-showcase-fg bottom-[-40px] left-[8%]'
        />
        <ParallaxSheet
            yRange={-80}
            className='bg-landing-paper bottom-[-20px] left-[33%] flex flex-col gap-1.5 p-3'
        >
            <div className='bg-landing-paper-ink h-2 w-[60%] rounded-[2px]' />
            <div className='bg-landing-paper-avatar mt-1.5 h-[5px] w-[90%] rounded-[2px]' />
            <div className='bg-landing-paper-avatar h-[5px] w-[80%] rounded-[2px]' />
        </ParallaxSheet>
        <ParallaxSheet
            yRange={-40}
            rotate={10}
            className='bg-landing-blue right-[8%] bottom-[-40px]'
        />
    </div>
);

export const DarkModeVisual = () => {
    const { ref, y } = useLandingParallax(-50);
    return (
        <div className='flex justify-center pb-2.5' aria-hidden='true'>
            <m.div
                ref={ref}
                className='from-landing-showcase-fg to-landing-showcase-chip ring-landing-showcase-line h-[150px] w-[150px] rounded-full bg-linear-to-r from-50% to-50% ring-1'
                style={{ y }}
            />
        </div>
    );
};

export const PdfVisual = () => {
    const { t } = useTranslation();
    return (
        <div
            className='text-[clamp(80px,9vw,120px)] leading-[0.9] font-bold tracking-[-0.05em]'
            aria-hidden='true'
        >
            {t('home.features.pdf.visual')}
        </div>
    );
};

export const I18nVisual = () => {
    const { t } = useTranslation();
    return (
        <div className='flex items-center gap-2.5 text-xl font-semibold' aria-hidden='true'>
            <div className='bg-landing-showcase-fg text-landing-paper-ink rounded-full px-[22px] py-2.5'>
                {t('home.features.i18n.visualEn')}
            </div>
            <div className='bg-landing-showcase-chip text-landing-showcase-fg rounded-full px-[22px] py-2.5'>
                {t('home.features.i18n.visualPl')}
            </div>
        </div>
    );
};

export const AutosaveVisual = () => {
    const { t } = useTranslation();
    return (
        <div
            className='bg-landing-showcase-chip inline-flex items-center gap-2.5 self-start rounded-full px-[18px] py-2.5 text-[15px]'
            aria-hidden='true'
        >
            <div className='bg-landing-green h-2 w-2 rounded-full' />
            {t('home.features.autosave.visual')}
        </div>
    );
};

export const PrivacyVisual = () => {
    const { t } = useTranslation();
    return (
        <div
            className='border-landing-showcase-line text-landing-showcase-muted border-t pt-[18px] text-[15px]'
            aria-hidden='true'
        >
            {t('home.features.privacy.visual')}
        </div>
    );
};
