import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    PREVIEW_CARD_IMAGES,
    PREVIEW_CARD_WIDTH,
    PREVIEW_HEIGHT,
    PREVIEW_IMAGES,
    PREVIEW_WIDTH,
} from '@/features/templates/previews/preview-images';
import { normalizeLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';
import { cn } from '@/lib/utils';

type TemplateSheetProps = {
    templateId: TemplateId;
    // With `sizes` the browser picks between the card and full files; without it, the full file
    sizes?: string;
    isPriority?: boolean;
    className?: string;
};

export const TemplateSheet = ({
    templateId,
    sizes,
    isPriority = false,
    className,
}: TemplateSheetProps) => {
    const { t, i18n } = useTranslation();
    const [failedSrc, setFailedSrc] = useState<string>();
    const lang = normalizeLang(i18n.language);
    const fullSrc = PREVIEW_IMAGES[templateId][lang];
    const cardSrc = PREVIEW_CARD_IMAGES[templateId][lang];
    const src = sizes ? cardSrc : fullSrc;

    return (
        <div
            className={cn(
                'bg-paper shadow-raised overflow-hidden rounded-xl transition-shadow',
                className,
            )}
            style={{ aspectRatio: `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}` }}
        >
            {/* A failed image is hidden, so the white sheet shows with no broken image icon */}
            <img
                src={src}
                srcSet={
                    sizes
                        ? `${cardSrc} ${PREVIEW_CARD_WIDTH}w, ${fullSrc} ${PREVIEW_WIDTH}w`
                        : undefined
                }
                sizes={sizes}
                width={PREVIEW_WIDTH}
                height={PREVIEW_HEIGHT}
                loading={isPriority ? 'eager' : 'lazy'}
                fetchPriority={isPriority ? 'high' : undefined}
                decoding='async'
                alt={t('templates.previewAlt', { name: t(`templates.${templateId}.name`) })}
                onError={() => setFailedSrc(src)}
                hidden={failedSrc === src}
                className='h-full w-full object-contain'
            />
        </div>
    );
};
