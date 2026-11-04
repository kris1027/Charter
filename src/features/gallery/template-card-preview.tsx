import { useTranslation } from 'react-i18next';
import { normalizeLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';
import {
    PREVIEW_HEIGHT,
    PREVIEW_IMAGES,
    PREVIEW_WIDTH,
} from '@/features/templates/previews/preview-images';

type TemplateCardPreviewProps = {
    templateId: TemplateId;
};

export const TemplateCardPreview = ({ templateId }: TemplateCardPreviewProps) => {
    const { t, i18n } = useTranslation();

    return (
        <div className='relative h-full w-full overflow-hidden'>
            <img
                src={PREVIEW_IMAGES[templateId][normalizeLang(i18n.language)]}
                width={PREVIEW_WIDTH}
                height={PREVIEW_HEIGHT}
                loading='lazy'
                decoding='async'
                alt={t('templates.previewAlt', { name: t(`templates.${templateId}.name`) })}
                className='h-full w-full object-cover object-top'
            />
            {/* Bottom fade to hide the hard clip edge */}
            <div className='absolute right-0 bottom-0 left-0 h-1/4 bg-gradient-to-t from-slate-100 via-slate-100/80 to-transparent dark:from-slate-900/90 dark:via-slate-900/60' />
        </div>
    );
};
