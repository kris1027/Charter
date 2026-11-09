import { useTranslation } from 'react-i18next';
import {
    GALLERY_CONTAINER_CLASS,
    GALLERY_HEADLINE_CLASS,
    GALLERY_PAGE_CLASS,
} from '@/features/gallery/gallery-classes';
import { GalleryNav } from '@/features/gallery/gallery-nav';
import { SavedResumeNotice } from '@/features/gallery/saved-resume-notice';
import { TemplateCard } from '@/features/gallery/template-card';
import { TEMPLATE_IDS } from '@/lib/template-ids';

export const TemplatesPage = () => {
    const { t } = useTranslation();

    return (
        <div className={GALLERY_PAGE_CLASS}>
            <GalleryNav backTo='/' backLabel={t('nav.backToHome')} />
            <div className={`${GALLERY_CONTAINER_CLASS} pt-16 pb-24`}>
                <header className='mx-auto mb-14 max-w-2xl text-center'>
                    <h1 className={`${GALLERY_HEADLINE_CLASS} text-[clamp(36px,5vw,56px)]`}>
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
