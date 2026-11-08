import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { m, useScroll, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useScrollEffects } from '@/features/landing/use-scroll-effects';
import {
    PREVIEW_HEIGHT,
    PREVIEW_IMAGES,
    PREVIEW_WIDTH,
} from '@/features/templates/previews/preview-images';
import { normalizeLang } from '@/lib/app-lang';
import { SEO_DEFAULTS } from '@/lib/seo';
import type { TemplateId } from '@/lib/template-ids';

const SHEET_RATIO = `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}`;
const TEXT_FADE_END = 0.4545;

type ScrollDrivenProps = {
    progress: MotionValue<number>;
    effects: boolean;
};

type HeroImageProps = {
    templateId: TemplateId;
    isCenter?: boolean;
};

const HeroImage = ({ templateId, isCenter = false }: HeroImageProps) => {
    const { i18n } = useTranslation();
    const [failedSrc, setFailedSrc] = useState<string>();
    const src = PREVIEW_IMAGES[templateId][normalizeLang(i18n.language)];
    return (
        // Browsers draw a broken icon on a sized image even with an empty alt, so a failed one is
        // hidden and the white card behind it shows as a blank sheet
        <img
            src={src}
            alt=''
            width={PREVIEW_WIDTH}
            height={PREVIEW_HEIGHT}
            loading={isCenter ? 'eager' : 'lazy'}
            fetchPriority={isCenter ? 'high' : 'low'}
            onError={() => setFailedSrc(src)}
            className={`block h-full w-full object-cover ${failedSrc === src ? 'invisible' : ''}`}
        />
    );
};

type HeroSideCardProps = ScrollDrivenProps & {
    templateId: TemplateId;
    rotate: number;
    edgeClassName: string;
};

const HeroSideCard = ({
    templateId,
    rotate,
    edgeClassName,
    progress,
    effects,
}: HeroSideCardProps) => {
    const y = useTransform(progress, [0, 1], ['0vh', '-35vh']);
    return (
        <m.div
            className={`bg-landing-paper shadow-landing-side absolute top-[90px] hidden w-[28%] overflow-hidden rounded-[14px] lg:block ${edgeClassName}`}
            style={{ rotate, y: effects ? y : 0, aspectRatio: SHEET_RATIO }}
        >
            <HeroImage templateId={templateId} />
        </m.div>
    );
};

const HeroCenterCard = ({ progress, effects }: ScrollDrivenProps) => {
    const y = useTransform(progress, [0, 1], ['0vh', '-12vh']);
    return (
        <m.div
            className='bg-landing-paper shadow-landing-hero w-[min(320px,80vw)] overflow-hidden rounded-[16px] lg:absolute lg:top-0 lg:left-1/2 lg:ml-[-19%] lg:w-[38%]'
            style={{ y: effects ? y : 0, aspectRatio: SHEET_RATIO }}
        >
            <HeroImage templateId='default' isCenter />
        </m.div>
    );
};

const HeroStage = ({ progress, effects }: ScrollDrivenProps) => {
    const y = useTransform(progress, [0, 1], [0, -260]);
    const scale = useTransform(progress, [0, 1], [1, 1.25]);
    return (
        <m.div
            className='relative mt-[8vh] flex justify-center lg:block lg:h-[560px] lg:w-[min(900px,92vw)]'
            style={{ y: effects ? y : 0, scale: effects ? scale : 1 }}
        >
            <HeroSideCard
                templateId='developer'
                rotate={-8}
                edgeClassName='left-[4%]'
                progress={progress}
                effects={effects}
            />
            <HeroSideCard
                templateId='veterinary'
                rotate={8}
                edgeClassName='right-[4%]'
                progress={progress}
                effects={effects}
            />
            <HeroCenterCard progress={progress} effects={effects} />
        </m.div>
    );
};

type HeroTextProps = ScrollDrivenProps & {
    onFocus: () => void;
    children: ReactNode;
};

// Opacity only: text never slides or scales with scroll
const HeroText = ({ progress, effects, onFocus, children }: HeroTextProps) => {
    const opacity = useTransform(progress, [0, TEXT_FADE_END], [1, 0]);
    return (
        <m.div
            className='max-w-[1000px] px-6 pt-[12vh] text-center'
            style={{ opacity: effects ? opacity : 1 }}
            onFocus={onFocus}
        >
            {children}
        </m.div>
    );
};

export const HeroSection = () => {
    const { t } = useTranslation();
    const effects = useScrollEffects();
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start start', 'end end'],
    });

    // The faded links can still take keyboard focus, so bring them back into view first
    const handleTextFocus = () => {
        const section = sectionRef.current;
        if (!effects || !section) return;
        const heroTop = section.getBoundingClientRect().top + window.scrollY;
        if (window.scrollY > heroTop) {
            window.scrollTo({ top: heroTop, behavior: 'instant' });
        }
    };

    return (
        <section
            ref={sectionRef}
            className='relative pb-24 lg:motion-safe:min-h-[200vh] lg:motion-safe:pb-0'
        >
            <div className='flex flex-col items-center lg:motion-safe:sticky lg:motion-safe:top-0 lg:motion-safe:h-screen lg:motion-safe:min-h-[640px] lg:motion-safe:overflow-hidden'>
                <HeroText progress={scrollYProgress} effects={effects} onFocus={handleTextFocus}>
                    <p className='text-landing-eyebrow mb-2.5 text-[21px] font-semibold tracking-[-0.01em]'>
                        {SEO_DEFAULTS.siteName}
                    </p>
                    <h1 className='text-[clamp(48px,8vw,96px)] leading-[1.02] font-bold tracking-[-0.045em] text-balance'>
                        {t('home.hero.title')}{' '}
                        <span className='text-landing-muted block'>
                            {t('home.hero.titleHighlight')}
                        </span>
                    </h1>
                    <p className='text-landing-fg-2 mx-auto mt-[22px] max-w-[560px] text-[clamp(19px,2vw,24px)] leading-[1.35] tracking-[-0.01em] text-pretty'>
                        {t('home.hero.subtitle')}
                    </p>
                    <div className='mt-[30px] flex flex-wrap items-center justify-center gap-[22px]'>
                        <Link
                            to='/templates'
                            className='bg-landing-accent text-landing-accent-fg hover:bg-landing-accent-hover rounded-full px-6 py-3 text-[17px] transition-colors duration-(--duration-fast)'
                        >
                            {t('home.hero.cta')}
                        </Link>
                        <Link
                            to='/'
                            hash='how'
                            className='text-landing-link inline-flex items-center gap-0.5 py-3 text-[17px] hover:underline'
                        >
                            {t('home.hero.seeHow')}
                            <ChevronRight className='h-4 w-4' aria-hidden='true' />
                        </Link>
                    </div>
                    <ul className='text-landing-fg-2 mt-[22px] flex flex-wrap justify-center gap-x-[18px] gap-y-1 text-[13px]'>
                        <li>{t('home.features.noSignup')}</li>
                        <li aria-hidden='true'>·</li>
                        <li>{t('home.features.free')}</li>
                        <li aria-hidden='true'>·</li>
                        <li>{t('home.features.exportPdf')}</li>
                    </ul>
                </HeroText>
                <HeroStage progress={scrollYProgress} effects={effects} />
            </div>
        </section>
    );
};
