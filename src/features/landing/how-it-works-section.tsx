import { useRef, useState } from 'react';
import { m, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { StepsCard } from '@/features/landing/steps-card';
import { useScrollEffects } from '@/features/landing/use-scroll-effects';
import { fadeInUp } from '@/lib/animation-variants';

const STEPS = [
    { number: '01', titleKey: 'step1Title', descKey: 'step1Desc' },
    { number: '02', titleKey: 'step2Title', descKey: 'step2Desc' },
    { number: '03', titleKey: 'step3Title', descKey: 'step3Desc' },
] as const;

const LAST_STEP = STEPS.length - 1;
const TOTAL_FILLS = 7;

const stepAt = (progress: number) => (progress < 0.34 ? 0 : progress < 0.67 ? 1 : LAST_STEP);
const fillsAt = (progress: number) =>
    Math.floor(Math.min(1, Math.max(0, (progress - 0.3) / 0.35)) * TOTAL_FILLS);

type StepsProgressProps = {
    progress: MotionValue<number>;
};

const StepsProgress = ({ progress }: StepsProgressProps) => (
    <div
        className='bg-landing-track mt-6 h-[3px] max-w-[360px] overflow-hidden rounded-sm'
        aria-hidden='true'
    >
        <m.div className='bg-landing-accent h-full origin-left' style={{ scaleX: progress }} />
    </div>
);

export const HowItWorksSection = () => {
    const { t } = useTranslation();
    const effects = useScrollEffects();
    const shouldReduceMotion = useReducedMotion();
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start start', 'end end'],
    });
    const [scrollStep, setScrollStep] = useState(0);
    const [scrollFills, setScrollFills] = useState(0);

    // React skips the render when the rounded value is unchanged
    useMotionValueEvent(scrollYProgress, 'change', (progress) => {
        setScrollStep(stepAt(progress));
        setScrollFills(fillsAt(progress));
    });

    return (
        <section
            id='how'
            ref={sectionRef}
            className='bg-landing-bg relative lg:motion-safe:h-[300vh]'
        >
            <div className='flex items-center px-6 py-24 lg:motion-safe:sticky lg:motion-safe:top-0 lg:motion-safe:h-screen lg:motion-safe:min-h-[560px] lg:motion-safe:overflow-hidden lg:motion-safe:py-0'>
                <div className='mx-auto grid w-full max-w-[1100px] grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-center gap-16'>
                    <m.div {...fadeInUp(0, shouldReduceMotion)}>
                        <p className='text-landing-fg-2 mb-3.5 text-[17px] font-semibold'>
                            {t('home.howItWorks.title')}
                        </p>
                        <h2 className='mb-6 text-[clamp(32px,4.5vw,56px)] leading-[1.05] font-bold tracking-[-0.04em]'>
                            {t('home.howItWorks.subtitle')}
                        </h2>
                        <ol className='flex flex-col gap-[18px]'>
                            {STEPS.map(({ number, titleKey, descKey }, i) => {
                                const isActive = !effects || i === scrollStep;
                                return (
                                    <li
                                        key={number}
                                        className='flex gap-5'
                                        aria-current={effects && isActive ? 'step' : undefined}
                                    >
                                        <span
                                            className={`min-w-6 text-[17px] font-semibold transition-colors duration-(--duration-slow) ${isActive ? 'text-landing-link' : 'text-landing-fg-2'}`}
                                        >
                                            {number}
                                        </span>
                                        <div>
                                            <h3
                                                className={`text-2xl font-semibold tracking-[-0.02em] transition-colors duration-(--duration-slow) ${isActive ? 'text-landing-fg' : 'text-landing-fg-2'}`}
                                            >
                                                {t(`home.howItWorks.${titleKey}`)}
                                            </h3>
                                            <p className='text-landing-fg-2 mt-1 text-[17px]'>
                                                {t(`home.howItWorks.${descKey}`)}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                        {effects && <StepsProgress progress={scrollYProgress} />}
                    </m.div>
                    <div className='flex justify-center'>
                        <StepsCard
                            progress={scrollYProgress}
                            effects={effects}
                            step={effects ? scrollStep : LAST_STEP}
                            fills={effects ? scrollFills : TOTAL_FILLS}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
