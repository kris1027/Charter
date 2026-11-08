import { m, useTransform } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { ScrollDrivenProps } from '@/features/landing/use-scroll-effects';

type BodyBarProps = {
    index: number;
    width: string;
    step: number;
    fills: number;
};

// A body line of the drawn CV: empty on the first step, then filled in as the steps go by
const BodyBar = ({ index, width, step, fills }: BodyBarProps) => (
    <div
        className={`h-1.5 rounded-[3px] transition-[width] duration-(--duration-base) ${index <= fills ? 'bg-landing-paper-filled' : 'bg-landing-paper-line'}`}
        style={{ width: step === 0 ? '0%' : width }}
    />
);

type StepsCardProps = ScrollDrivenProps & {
    step: number;
    fills: number;
    showPill: boolean;
};

export const StepsCard = ({
    progress,
    hasScrollEffects,
    step,
    fills,
    showPill,
}: StepsCardProps) => {
    const { t } = useTranslation();
    const rotate = useTransform(progress, [0, 1], [4, -4]);
    const y = useTransform(progress, [0, 1], [30, -30]);
    const barProgress = { step, fills };

    return (
        <div className='relative w-[min(360px,80vw)]' aria-hidden='true'>
            <m.div
                className='bg-landing-paper shadow-landing-hero flex aspect-[0.72] flex-col gap-2.5 rounded-[18px] p-[30px]'
                style={{ rotate: hasScrollEffects ? rotate : 0, y: hasScrollEffects ? y : 0 }}
            >
                <div className='flex items-center gap-3.5'>
                    <div className='bg-landing-paper-avatar h-[46px] w-[46px] rounded-full' />
                    <div className='flex flex-1 flex-col gap-[7px]'>
                        <div className='bg-landing-paper-ink h-3 w-[70%] rounded-[3px]' />
                        <div className='bg-landing-paper-sub h-[7px] w-[45%] rounded-[3px]' />
                    </div>
                </div>
                <div className='bg-landing-accent mt-[18px] h-[7px] w-[28%] rounded-[3px]' />
                <BodyBar index={1} width='100%' {...barProgress} />
                <BodyBar index={2} width='92%' {...barProgress} />
                <BodyBar index={3} width='96%' {...barProgress} />
                <div className='bg-landing-accent mt-4 h-[7px] w-[32%] rounded-[3px]' />
                <BodyBar index={4} width='98%' {...barProgress} />
                <BodyBar index={5} width='84%' {...barProgress} />
                <BodyBar index={6} width='90%' {...barProgress} />
            </m.div>
            {/* Text never moves with scroll, so the pill sits outside the moving card, high enough
                to stay on it when the card has risen */}
            <div
                data-state={showPill ? 'visible' : 'hidden'}
                className={`bg-landing-accent text-landing-accent-fg absolute inset-x-0 bottom-[50px] mx-auto w-fit rounded-full px-[18px] py-2 text-sm transition-[opacity,translate] duration-(--duration-slow) ${showPill ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
            >
                {t('home.howItWorks.downloadPill')}
            </div>
        </div>
    );
};
