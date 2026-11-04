import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
    Eye,
    ArrowLeft,
    RotateCcw,
    FileCheck,
    AlertTriangle,
    Code2,
    FileText,
    Heart,
} from 'lucide-react';
import { TemplateCardPreview } from '@/features/gallery/template-card-preview';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { motion, useReducedMotion } from 'motion/react';
import { ParallaxBackground } from '@/components/parallax-background';
import { fadeInUp } from '@/lib/animation-variants';
import { safeStorage } from '@/lib/storage';
import type { TemplateId } from '@/lib/template-ids';

const templates = [
    {
        id: 'developer',
        nameKey: 'templates.developer.name',
        descriptionKey: 'templates.developer.description',
        icon: Code2,
        gradient: 'from-indigo-500 to-violet-600',
    },
    {
        id: 'default',
        nameKey: 'templates.default.name',
        descriptionKey: 'templates.default.description',
        icon: FileText,
        gradient: 'from-slate-500 to-gray-600',
    },
    {
        id: 'veterinary',
        nameKey: 'templates.veterinary.name',
        descriptionKey: 'templates.veterinary.description',
        icon: Heart,
        gradient: 'from-emerald-500 to-teal-600',
    },
] satisfies { id: TemplateId; [key: string]: unknown }[];

export const TemplatesPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const shouldReduceMotion = useReducedMotion();
    const [hasSavedData, setHasSavedData] = useState(() => !!safeStorage.getItem('resumeData'));
    const [lastSaved, setLastSaved] = useState<Date | null>(() => {
        const savedTime = safeStorage.getItem('resumeData_lastSaved');
        return hasSavedData && savedTime ? new Date(savedTime) : null;
    });

    const handleReset = () => {
        safeStorage.removeItem('resumeData');
        safeStorage.removeItem('resumeData_backup');
        safeStorage.removeItem('resumeData_lastSaved');
        setHasSavedData(false);
        setLastSaved(null);
    };

    const formatSavedTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t('savedData.justNow');
        if (diffMins < 60)
            return diffMins === 1
                ? t('savedData.minuteAgo', { count: diffMins })
                : t('savedData.minutesAgo', { count: diffMins });
        if (diffHours < 24)
            return diffHours === 1
                ? t('savedData.hourAgo', { count: diffHours })
                : t('savedData.hoursAgo', { count: diffHours });
        if (diffDays < 7)
            return diffDays === 1
                ? t('savedData.dayAgo', { count: diffDays })
                : t('savedData.daysAgo', { count: diffDays });
        return date.toLocaleDateString();
    };

    return (
        <div className='relative min-h-screen overflow-hidden'>
            <ParallaxBackground />

            {/* Navigation Bar */}
            <div className='sticky top-0 z-10 border-b border-white/20 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80'>
                <div className='container mx-auto px-4 py-4'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            <Button asChild variant='outline' size='sm'>
                                <Link to='/'>
                                    <ArrowLeft className='mr-2 h-4 w-4' />
                                    {t('nav.backToHome')}
                                </Link>
                            </Button>
                            <h1 className='font-display text-xl font-semibold dark:text-gray-100'>
                                {t('templates.title')}
                            </h1>
                        </div>
                        <div className='flex items-center gap-2'>
                            <LanguageToggle />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>

            <div className='relative z-[1] container mx-auto px-4 py-12'>
                {/* Page Header */}
                <div className='animate-blur-in mx-auto mb-12 max-w-2xl text-center'>
                    <span className='mb-4 inline-flex items-center rounded-full border border-indigo-200/60 bg-indigo-50/80 px-3 py-1 text-xs font-medium text-indigo-700 backdrop-blur-sm dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300'>
                        {t('templates.badge')}
                    </span>
                    <h1 className='font-display mb-4 text-4xl font-bold tracking-tight sm:text-5xl'>
                        {t('templates.pageTitle').split(' ').slice(0, -1).join(' ')}{' '}
                        <span className='bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400'>
                            {t('templates.pageTitle').split(' ').slice(-1)}
                        </span>
                    </h1>
                    <p className='text-muted-foreground text-lg'>{t('templates.pageSubtitle')}</p>
                </div>

                {/* Saved Data Info */}
                {hasSavedData && (
                    <motion.div
                        className='mx-auto mb-10 max-w-3xl'
                        {...fadeInUp(0, shouldReduceMotion)}
                    >
                        <div className='rounded-2xl border border-white/20 bg-white/60 p-4 backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.03]'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='inline-flex rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-2.5 text-white shadow-lg'>
                                        <FileCheck className='h-5 w-5' />
                                    </div>
                                    <div>
                                        <p className='font-medium dark:text-gray-100'>
                                            {t('savedData.title')}
                                        </p>
                                        {lastSaved && (
                                            <p className='text-muted-foreground text-sm'>
                                                {t('savedData.lastSaved', {
                                                    time: formatSavedTime(lastSaved),
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            className='transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                                        >
                                            <RotateCcw className='mr-2 h-4 w-4' />
                                            {t('builder.reset')}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <div className='flex items-center gap-3'>
                                                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
                                                    <AlertTriangle className='h-5 w-5 text-red-600 dark:text-red-400' />
                                                </div>
                                                <AlertDialogTitle>
                                                    {t('dialogs.reset.title')}
                                                </AlertDialogTitle>
                                            </div>
                                            <AlertDialogDescription className='pt-2'>
                                                {t('dialogs.reset.description')}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                {t('dialogs.reset.cancel')}
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleReset}
                                                className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
                                            >
                                                {t('dialogs.reset.confirm')}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Template Cards Grid */}
                <div className='mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                    {templates.map((template, index) => (
                        <motion.div
                            key={template.id}
                            className='group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200/60 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-white/5 dark:bg-white/[0.03] dark:hover:border-indigo-500/20 dark:hover:shadow-indigo-500/5'
                            {...fadeInUp(index * 0.1, shouldReduceMotion)}
                        >
                            {/* Hover gradient glow */}
                            <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/0 to-violet-50/0 transition-colors duration-300 group-hover:from-indigo-50/50 group-hover:to-violet-50/30 dark:group-hover:from-indigo-500/5 dark:group-hover:to-violet-500/5' />

                            <div className='relative'>
                                {/* Preview Area — a div+navigate that opens the template detail page */}
                                <div
                                    role='link'
                                    tabIndex={0}
                                    onClick={() =>
                                        navigate({
                                            to: '/templates/$templateId',
                                            params: { templateId: template.id },
                                        })
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            navigate({
                                                to: '/templates/$templateId',
                                                params: { templateId: template.id },
                                            });
                                        }
                                    }}
                                    className='cursor-pointer'
                                >
                                    <div className='relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-800/50 dark:to-slate-900/50'>
                                        <div className='h-full w-full text-gray-900 transition-transform duration-500 group-hover:scale-105'>
                                            <TemplateCardPreview templateId={template.id} />
                                        </div>

                                        {/* Gradient overlay on hover */}
                                        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100' />

                                        {/* Preview pill on hover */}
                                        <div className='absolute inset-0 flex items-center justify-center'>
                                            <div className='translate-y-8 transform opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100'>
                                                <div className='flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 shadow-lg backdrop-blur-sm'>
                                                    <Eye className='h-4 w-4 text-gray-700' />
                                                    <span className='text-sm font-medium text-gray-700'>
                                                        {t('templates.preview')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className='p-5'>
                                    {/* Gradient icon badge + title */}
                                    <div className='mb-3 flex items-center gap-3'>
                                        <div
                                            className={`inline-flex rounded-xl bg-gradient-to-br ${template.gradient} p-2 text-white shadow-lg`}
                                        >
                                            <template.icon className='h-4 w-4' />
                                        </div>
                                        <h3 className='text-base font-semibold dark:text-gray-100'>
                                            {t(template.nameKey)}
                                        </h3>
                                    </div>

                                    {/* Description */}
                                    <p className='text-muted-foreground mb-5 line-clamp-2 text-sm leading-relaxed'>
                                        {t(template.descriptionKey)}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className='flex gap-2'>
                                        <Button
                                            asChild
                                            variant='outline'
                                            size='sm'
                                            className='group/btn flex-1'
                                        >
                                            <Link
                                                to='/templates/$templateId'
                                                params={{ templateId: template.id }}
                                            >
                                                <Eye className='mr-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:scale-110' />
                                                <span className='text-xs'>
                                                    {t('templates.preview')}
                                                </span>
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size='sm'
                                            className='flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-md'
                                        >
                                            <Link
                                                to='/builder'
                                                search={{ templateId: template.id }}
                                            >
                                                <span className='text-xs'>
                                                    {t('templates.useTemplate')}
                                                </span>
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
