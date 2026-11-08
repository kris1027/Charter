import { m, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { useTranslation } from 'react-i18next';

const LAST_STEP = 2;

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

type StepsCardProps = {
    progress: MotionValue<number>;
    effects: boolean;
    step: number;
    fills: number;
};

export const StepsCard = ({ progress, effects, step, fills }: StepsCardProps) => {
    const { t } = useTranslation();
    const rotate = useTransform(progress, [0, 1], [4, -4]);
    const y = useTransform(progress, [0, 1], [30, -30]);
    const showPill = step === LAST_STEP;
    const bar = { step, fills };

    return (
        <m.div
            className='bg-landing-paper shadow-landing-hero flex aspect-[0.72] w-[min(360px,80vw)] flex-col gap-2.5 rounded-[18px] p-[30px]'
            style={{ rotate: effects ? rotate : 0, y: effects ? y : 0 }}
            aria-hidden='true'
        >
            <div className='flex items-center gap-3.5'>
                <div className='bg-landing-paper-avatar h-[46px] w-[46px] rounded-full' />
                <div className='flex flex-1 flex-col gap-[7px]'>
                    <div className='bg-landing-paper-ink h-3 w-[70%] rounded-[3px]' />
                    <div className='bg-landing-paper-sub h-[7px] w-[45%] rounded-[3px]' />
                </div>
            </div>
            <div className='bg-landing-accent mt-[18px] h-[7px] w-[28%] rounded-[3px]' />
            <BodyBar index={1} width='100%' {...bar} />
            <BodyBar index={2} width='92%' {...bar} />
            <BodyBar index={3} width='96%' {...bar} />
            <div className='bg-landing-accent mt-4 h-[7px] w-[32%] rounded-[3px]' />
            <BodyBar index={4} width='98%' {...bar} />
            <BodyBar index={5} width='84%' {...bar} />
            <BodyBar index={6} width='90%' {...bar} />
            <div className='flex-1' />
            <div
                className={`bg-landing-accent text-landing-accent-fg self-center rounded-full px-[18px] py-2 text-sm transition-[opacity,translate] duration-(--duration-slow) ${showPill ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
            >
                {t('home.howItWorks.downloadPill')}
            </div>
        </m.div>
    );
};
