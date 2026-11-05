import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    ClipboardList,
    Download,
    Edit3,
    FileDown,
    Globe,
    Layout,
    Moon,
    Palette,
    Save,
    Shield,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { m, useReducedMotion } from 'motion/react';
import { useParallax } from '@/hooks/use-parallax';
import { GeometricShapes } from '@/components/geometric-shapes';
import { fadeInUp, fadeInScale } from '@/lib/animation-variants';

const FloatingCvMockup = () => (
    <div className='animate-float relative' aria-hidden='true'>
        {/* CV Document */}
        <div className='relative w-64 rounded-lg border border-white/20 bg-white p-6 shadow-2xl sm:w-72 lg:w-80 dark:border-white/10 dark:bg-white'>
            {/* Header bar */}
            <div className='mb-4 flex items-center gap-3'>
                <div className='h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500' />
                <div className='flex-1 space-y-1.5'>
                    <div className='h-2.5 w-24 rounded-full bg-slate-800' />
                    <div className='h-2 w-16 rounded-full bg-slate-400' />
                </div>
            </div>
            {/* Section bars */}
            <div className='mb-3 h-2 w-20 rounded-full bg-indigo-500/70' />
            <div className='mb-1.5 h-1.5 w-full rounded-full bg-slate-200' />
            <div className='mb-1.5 h-1.5 w-11/12 rounded-full bg-slate-200' />
            <div className='mb-4 h-1.5 w-3/4 rounded-full bg-slate-200' />
            <div className='mb-3 h-2 w-16 rounded-full bg-indigo-500/70' />
            <div className='mb-1.5 h-1.5 w-full rounded-full bg-slate-200' />
            <div className='mb-1.5 h-1.5 w-10/12 rounded-full bg-slate-200' />
            <div className='mb-4 h-1.5 w-2/3 rounded-full bg-slate-200' />
            <div className='mb-3 h-2 w-14 rounded-full bg-indigo-500/70' />
            <div className='flex gap-2'>
                <div className='h-5 w-14 rounded-full bg-slate-100' />
                <div className='h-5 w-12 rounded-full bg-slate-100' />
                <div className='h-5 w-16 rounded-full bg-slate-100' />
            </div>
        </div>
        {/* Decorative glow behind the mockup */}
        <div className='absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-transparent blur-2xl' />
    </div>
);

export const IndexPage = () => {
    const { t } = useTranslation();
    const shouldReduceMotion = useReducedMotion();

    // Parallax for hero decorative layers
    const { ref: heroGradientRef, y: heroGradientY } = useParallax({ yRange: 30 });
    const { ref: heroDotsRef, y: heroDotsY } = useParallax({ yRange: 15 });
    const { ref: heroShapesRef, y: heroShapesY } = useParallax({ yRange: 40 });
    const { ref: heroMockupRef, y: heroMockupY } = useParallax({ yRange: 20 });

    // Parallax for how-it-works background
    const { ref: howItWorksDotsRef, y: howItWorksDotsY } = useParallax({ yRange: 10 });

    // Parallax for CTA decorative circles
    const { ref: ctaCircleLeftRef, y: ctaCircleLeftY } = useParallax({ yRange: 25 });
    const { ref: ctaCircleRightRef, y: ctaCircleRightY } = useParallax({ yRange: -25 });

    return (
        <div className='min-h-screen overflow-hidden'>
            {/* Language and Theme Toggle */}
            <div className='absolute top-4 right-4 z-50 flex items-center gap-2'>
                <LanguageToggle />
                <ThemeToggle />
            </div>

            {/* ===== HERO SECTION ===== */}
            <section className='relative min-h-[90vh] overflow-hidden'>
                {/* Background gradient mesh */}
                <m.div
                    ref={heroGradientRef}
                    style={{ y: heroGradientY }}
                    className='animate-gradient-shift absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/80'
                />

                {/* Dot grid pattern */}
                <m.div
                    ref={heroDotsRef}
                    style={{
                        y: heroDotsY,
                        backgroundImage:
                            'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                    className='absolute inset-0 opacity-[0.03] dark:opacity-[0.04]'
                    aria-hidden='true'
                />

                <m.div ref={heroShapesRef} style={{ y: heroShapesY }}>
                    <GeometricShapes />
                </m.div>

                <div className='relative z-10 container mx-auto flex min-h-[90vh] items-center px-4 py-20'>
                    <div className='grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16'>
                        {/* Left: Text Content */}
                        <div className='max-w-2xl'>
                            <h1 className='font-display animate-blur-in mb-6 text-5xl leading-[1.1] font-extrabold tracking-tight sm:text-6xl lg:text-7xl'>
                                {t('home.hero.title')}{' '}
                                <span className='bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400'>
                                    {t('home.hero.titleHighlight')}
                                </span>
                            </h1>
                            <p className='animate-fade-in-up text-muted-foreground mb-10 max-w-lg text-lg delay-1 sm:text-xl'>
                                {t('home.hero.subtitle')}
                            </p>
                            <div className='animate-fade-in-up delay-2'>
                                <Button
                                    asChild
                                    size='lg'
                                    className='animate-pulse-glow group h-12 cursor-pointer rounded-xl px-8 text-base'
                                >
                                    <Link to='/templates'>
                                        <Edit3 className='mr-2 h-5 w-5' />
                                        {t('home.hero.cta')}
                                        <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
                                    </Link>
                                </Button>
                            </div>
                            {/* Trust badges */}
                            <div className='animate-fade-in-up text-muted-foreground mt-10 flex flex-wrap items-center gap-6 text-sm delay-3'>
                                <span className='flex items-center gap-2'>
                                    <span className='inline-block h-1.5 w-1.5 rounded-full bg-emerald-500' />
                                    {t('home.features.noSignup')}
                                </span>
                                <span className='flex items-center gap-2'>
                                    <span className='inline-block h-1.5 w-1.5 rounded-full bg-emerald-500' />
                                    {t('home.features.free')}
                                </span>
                                <span className='flex items-center gap-2'>
                                    <span className='inline-block h-1.5 w-1.5 rounded-full bg-emerald-500' />
                                    {t('home.features.exportPdf')}
                                </span>
                            </div>
                        </div>

                        {/* Right: Floating CV Mockup */}
                        <m.div
                            ref={heroMockupRef}
                            style={{ y: heroMockupY }}
                            className='hidden justify-center lg:flex'
                        >
                            <FloatingCvMockup />
                        </m.div>
                    </div>
                </div>

                {/* Bottom fade */}
                <div className='absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-slate-950' />
            </section>

            {/* ===== FEATURES SECTION ===== */}
            <section className='relative bg-white py-24 dark:bg-slate-950'>
                <div className='container mx-auto px-4'>
                    <m.div
                        className='mx-auto mb-16 max-w-2xl text-center'
                        {...fadeInUp(0, shouldReduceMotion)}
                    >
                        <h2 className='font-display mb-4 text-3xl font-bold tracking-tight sm:text-4xl'>
                            {t('home.features.title')}
                        </h2>
                        <p className='text-muted-foreground text-lg'>
                            {t('home.features.subtitle')}
                        </p>
                    </m.div>

                    <div className='mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        {(
                            [
                                {
                                    icon: Layout,
                                    key: 'templates' as const,
                                    gradient: 'from-indigo-500 to-blue-600',
                                },
                                {
                                    icon: Moon,
                                    key: 'darkMode' as const,
                                    gradient: 'from-violet-500 to-purple-600',
                                },
                                {
                                    icon: Download,
                                    key: 'pdf' as const,
                                    gradient: 'from-cyan-500 to-blue-600',
                                },
                                {
                                    icon: Globe,
                                    key: 'i18n' as const,
                                    gradient: 'from-emerald-500 to-teal-600',
                                },
                                {
                                    icon: Save,
                                    key: 'autosave' as const,
                                    gradient: 'from-amber-500 to-orange-600',
                                },
                                {
                                    icon: Shield,
                                    key: 'privacy' as const,
                                    gradient: 'from-rose-500 to-pink-600',
                                },
                            ] as const
                        ).map(({ icon: Icon, key, gradient }, i) => (
                            <m.div
                                key={key}
                                className='group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200/60 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-white/5 dark:bg-white/[0.03] dark:hover:border-indigo-500/20 dark:hover:shadow-indigo-500/5'
                                {...fadeInUp(i * 0.1, shouldReduceMotion)}
                            >
                                {/* Hover gradient glow */}
                                <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/0 to-violet-50/0 transition-colors duration-300 group-hover:from-indigo-50/50 group-hover:to-violet-50/30 dark:group-hover:from-indigo-500/5 dark:group-hover:to-violet-500/5' />
                                <div className='relative'>
                                    <div
                                        className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${gradient} p-2.5 text-white shadow-lg`}
                                    >
                                        <Icon className='h-5 w-5' />
                                    </div>
                                    <h3 className='mb-2 text-lg font-semibold'>
                                        {t(`home.features.${key}.title`)}
                                    </h3>
                                    <p className='text-muted-foreground text-sm leading-relaxed'>
                                        {t(`home.features.${key}.desc`)}
                                    </p>
                                </div>
                            </m.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS SECTION ===== */}
            <section className='relative overflow-hidden bg-slate-50/50 py-24 dark:bg-slate-900/50'>
                {/* Subtle background texture */}
                <m.div
                    ref={howItWorksDotsRef}
                    style={{
                        y: howItWorksDotsY,
                        backgroundImage:
                            'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                    className='absolute inset-0 opacity-[0.015] dark:opacity-[0.03]'
                    aria-hidden='true'
                />

                <div className='relative container mx-auto px-4'>
                    <m.div
                        className='mx-auto mb-20 max-w-2xl text-center'
                        {...fadeInUp(0, shouldReduceMotion)}
                    >
                        <h2 className='font-display mb-4 text-3xl font-bold tracking-tight sm:text-4xl'>
                            {t('home.howItWorks.title')}
                        </h2>
                        <p className='text-muted-foreground text-lg'>
                            {t('home.howItWorks.subtitle')}
                        </p>
                    </m.div>

                    <div className='mx-auto max-w-4xl'>
                        <div className='relative grid gap-8 md:grid-cols-3 md:gap-12'>
                            {/* Animated connector line (desktop) */}
                            <div className='animate-draw-line absolute top-14 left-[calc(16.67%+24px)] hidden h-0.5 w-[calc(66.66%-48px)] bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 delay-3 md:block' />

                            {(
                                [
                                    {
                                        icon: Palette,
                                        step: 1,
                                        titleKey: 'step1Title',
                                        descKey: 'step1Desc',
                                        gradient: 'from-indigo-500 to-blue-600',
                                    },
                                    {
                                        icon: ClipboardList,
                                        step: 2,
                                        titleKey: 'step2Title',
                                        descKey: 'step2Desc',
                                        gradient: 'from-violet-500 to-purple-600',
                                    },
                                    {
                                        icon: FileDown,
                                        step: 3,
                                        titleKey: 'step3Title',
                                        descKey: 'step3Desc',
                                        gradient: 'from-purple-500 to-pink-600',
                                    },
                                ] as const
                            ).map(({ icon: Icon, step, titleKey, descKey, gradient }, i) => (
                                <m.div
                                    key={step}
                                    className='text-center'
                                    {...fadeInUp(i * 0.15, shouldReduceMotion)}
                                >
                                    {/* Step circle with icon */}
                                    <div className='relative mx-auto mb-6'>
                                        <div
                                            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
                                        >
                                            <Icon className='h-6 w-6' />
                                        </div>
                                        {/* Step number badge */}
                                        <span className='absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700 shadow-md dark:bg-slate-800 dark:text-slate-200'>
                                            {step}
                                        </span>
                                    </div>
                                    <h3 className='font-display mb-2 text-lg font-semibold'>
                                        {t(`home.howItWorks.${titleKey}`)}
                                    </h3>
                                    <p className='text-muted-foreground mx-auto max-w-xs text-sm leading-relaxed'>
                                        {t(`home.howItWorks.${descKey}`)}
                                    </p>
                                </m.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== STATS SECTION ===== */}
            <section className='relative overflow-hidden bg-slate-50/50 py-20 dark:bg-slate-900/50'>
                <div className='container mx-auto px-4'>
                    <div className='mx-auto grid max-w-4xl grid-cols-3 gap-8 text-center'>
                        {(
                            [
                                {
                                    value: 'home.stats.avgTime',
                                    label: 'home.stats.avgTimeLabel',
                                    gradient: 'from-indigo-500 to-blue-600',
                                },
                                {
                                    value: 'home.stats.freeForever',
                                    label: 'home.stats.freeForeverLabel',
                                    gradient: 'from-violet-500 to-purple-600',
                                },
                                {
                                    value: 'home.stats.languages',
                                    label: 'home.stats.languagesLabel',
                                    gradient: 'from-emerald-500 to-teal-600',
                                },
                            ] as const
                        ).map(({ value, label, gradient }, i) => (
                            <m.div key={value} {...fadeInScale(i * 0.1, shouldReduceMotion)}>
                                <p
                                    className={`font-display mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl`}
                                >
                                    {t(value)}
                                </p>
                                <p className='text-muted-foreground text-sm font-medium tracking-wider uppercase'>
                                    {t(label)}
                                </p>
                            </m.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== BOTTOM CTA SECTION ===== */}
            <section className='relative overflow-hidden bg-white py-24 dark:bg-slate-950'>
                {/* Gradient background */}
                <div className='absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50/50 dark:from-indigo-950/30 dark:via-slate-950 dark:to-violet-950/20' />
                {/* Decorative shapes */}
                <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
                    <m.div
                        ref={ctaCircleLeftRef}
                        style={{ y: ctaCircleLeftY }}
                        className='animate-float absolute top-12 left-[10%] h-32 w-32 rounded-full bg-indigo-500/5 blur-2xl dark:bg-indigo-500/10'
                    />
                    <m.div
                        ref={ctaCircleRightRef}
                        style={{ y: ctaCircleRightY }}
                        className='animate-float-reverse absolute right-[10%] bottom-12 h-40 w-40 rounded-full bg-violet-500/5 blur-2xl dark:bg-violet-500/10'
                    />
                </div>

                <div className='relative container mx-auto px-4 text-center'>
                    <m.div className='mx-auto max-w-2xl' {...fadeInUp(0, shouldReduceMotion)}>
                        <h2 className='font-display mb-6 text-4xl font-bold tracking-tight sm:text-5xl'>
                            {t('home.cta.title')}
                        </h2>
                        <p className='text-muted-foreground mb-10 text-lg'>
                            {t('home.cta.subtitle')}
                        </p>
                        <Button
                            asChild
                            size='lg'
                            className='animate-pulse-glow group h-14 cursor-pointer rounded-xl px-10 text-lg'
                        >
                            <Link to='/templates'>
                                {t('home.cta.button')}
                                <ArrowRight className='ml-2 h-5 w-5 transition-transform group-hover:translate-x-1' />
                            </Link>
                        </Button>
                    </m.div>
                </div>
            </section>
        </div>
    );
};

export default IndexPage;
