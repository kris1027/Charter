import { useTranslation } from 'react-i18next';
import { GalleryNav } from '@/features/gallery/gallery-nav';
import { SavedResumeNotice } from '@/features/gallery/saved-resume-notice';
import { TemplateCard } from '@/features/gallery/template-card';
import { TEMPLATE_IDS } from '@/lib/template-ids';

export const TemplatesPage = () => {
    const { t } = useTranslation();

    return (
        <div className='bg-background text-foreground min-h-dvh overflow-x-clip'>
            <GalleryNav backTo='/' backLabel={t('nav.backToHome')} />
            <div className='mx-auto max-w-[1100px] px-6 pt-16 pb-24'>
                <header className='mx-auto mb-14 max-w-2xl text-center'>
                    <h1 className='font-display text-[clamp(36px,5vw,56px)] leading-[1.05] font-bold tracking-[-0.04em] text-balance'>
                        {t('templates.pageTitle')}
                    </h1>
                    <p className='text-muted-foreground mt-4 text-lg'>
                        {t('templates.pageSubtitle')}
                    </p>
                </header>
                <SavedResumeNotice />
                <div className='grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3'>
                    {TEMPLATE_IDS.map((templateId, index) => (
                        <TemplateCard
                            key={templateId}
                            templateId={templateId}
                            isPriority={index === 0}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
