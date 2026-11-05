import { calculateProgress } from '@/features/builder/calculate-progress';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { fadeInUp } from '@/lib/animation-variants';
import { CheckCircle } from 'lucide-react';
import { m, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export const FormProgress = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();
        const shouldReduceMotion = useReducedMotion();

        return (
            <m.div
                className='mb-8 rounded-2xl border border-white/20 bg-white/60 p-5 backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.03]'
                {...fadeInUp(0, shouldReduceMotion)}
            >
                {/* Selects a number, so the card rerenders only when the percent changes */}
                <form.Subscribe selector={(state) => calculateProgress(state.values)}>
                    {(progress) => (
                        <>
                            <div className='mb-3 flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div
                                        className='inline-flex rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2 text-white shadow-lg'
                                        aria-hidden='true'
                                    >
                                        <CheckCircle className='h-4 w-4' />
                                    </div>
                                    <span className='font-display text-sm font-semibold dark:text-slate-200'>
                                        {t('builder.progress.title')}
                                    </span>
                                </div>
                                <span className='rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-0.5 text-xs font-bold text-white shadow-sm'>
                                    {progress}%
                                </span>
                            </div>
                            <div className='h-3 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10'>
                                <div
                                    className='h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 shadow-sm shadow-indigo-500/25 transition-all duration-500 ease-out'
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className='text-muted-foreground mt-2 text-xs'>
                                {progress === 100
                                    ? t('builder.progress.complete')
                                    : t('builder.progress.incomplete')}
                            </div>
                        </>
                    )}
                </form.Subscribe>
            </m.div>
        );
    },
});
