import { Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { GalleryNav } from '@/features/gallery/gallery-nav';
import { TemplateSheet } from '@/features/gallery/template-sheet';
import { SAMPLE_RESUMES } from '@/features/resume/sample-resumes';
import { LazyGalleryPdfViewer } from '@/features/templates/pdf/lazy-gallery-pdf-viewer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { normalizeLang } from '@/lib/app-lang';
import { isTemplateId } from '@/lib/template-ids';

const PAGE_CLASS = 'bg-background text-foreground min-h-dvh overflow-x-clip';

export const TemplatePage = () => {
    const { t, i18n } = useTranslation();
    const { templateId } = useParams({ from: '/templates_/$templateId' });
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    const lang = normalizeLang(i18n.language);

    if (!isTemplateId(templateId)) {
        return (
            <div className={PAGE_CLASS}>
                <GalleryNav backTo='/templates' backLabel={t('nav.backToTemplates')} />
                <div className='mx-auto max-w-[1100px] px-6 py-24 text-center'>
                    <h1 className='font-display mb-6 text-2xl font-bold'>
                        {t('templates.notFound')}
                    </h1>
                    <Button asChild className='rounded-full'>
                        <Link to='/templates'>{t('nav.backToTemplates')}</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const name = t(`templates.${templateId}.name`);
    const sheet = (
        <TemplateSheet
            templateId={templateId}
            isPriority
            className={isDesktop ? 'mx-auto h-full max-w-full' : 'mx-auto w-full max-w-[480px]'}
        />
    );

    return (
        <div className={`${PAGE_CLASS} lg:flex lg:h-dvh lg:min-h-[640px] lg:flex-col`}>
            <GalleryNav backTo='/templates' backLabel={t('nav.backToTemplates')} />
            <div className='mx-auto w-full max-w-[1100px] px-6 py-10 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-12 lg:py-8'>
                <div className='mb-10 text-center lg:mb-0 lg:self-center lg:text-left'>
                    <h1 className='font-display text-[clamp(32px,4vw,44px)] leading-[1.05] font-bold tracking-[-0.04em] text-balance'>
                        {name}
                    </h1>
                    <p className='text-muted-foreground mt-4 text-lg'>
                        {t(`templates.${templateId}.description`)}
                    </p>
                    <Button asChild className='mt-6 rounded-full'>
                        <Link to='/builder' search={{ templateId }}>
                            {t('templates.useTemplate')}
                        </Link>
                    </Button>
                </div>
                <div className='lg:bg-muted lg:min-h-0 lg:overflow-hidden lg:rounded-xl lg:border'>
                    {isDesktop ? (
                        // A failed chunk or render leaves the image in place, with no error text
                        <ErrorBoundary fallback={() => sheet}>
                            <LazyGalleryPdfViewer
                                templateId={templateId}
                                data={SAMPLE_RESUMES[templateId][lang]}
                                compactScale={0}
                                lang={lang}
                                title={t('templates.pdfTitle', { name })}
                                placeholder={sheet}
                            />
                        </ErrorBoundary>
                    ) : (
                        sheet
                    )}
                </div>
            </div>
        </div>
    );
};
