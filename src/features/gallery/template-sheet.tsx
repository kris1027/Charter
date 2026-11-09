import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PREVIEW_CARD_IMAGES, PREVIEW_IMAGES } from '@/features/templates/previews/preview-images';
import {
    PREVIEW_CARD_WIDTH,
    PREVIEW_HEIGHT,
    PREVIEW_WIDTH,
} from '@/features/templates/previews/preview-sizes';
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
    const alt = t('templates.previewAlt', { name: t(`templates.${templateId}.name`) });
    const hasFailed = failedSrc === src;

    return (
        // A hidden image names nothing, so the sheet takes over its name when the image fails
        <div
            role={hasFailed ? 'img' : undefined}
            aria-label={hasFailed ? alt : undefined}
            className={cn(
                'bg-paper shadow-raised overflow-hidden rounded-xl transition-shadow duration-(--duration-fast)',
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
                alt={alt}
                onError={() => setFailedSrc(src)}
                hidden={hasFailed}
                className='h-full w-full object-contain'
            />
        </div>
    );
};
