import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PillButton } from '@/features/gallery/pill-button';
import { TemplateSheet } from '@/features/gallery/template-sheet';
import type { TemplateId } from '@/lib/template-ids';

// Matches the grid in templates-page.tsx, so the browser picks the right file before layout
const CARD_SIZES =
    '(min-width: 1024px) 340px, (min-width: 640px) calc(50vw - 40px), min(320px, 80vw)';

type TemplateCardProps = {
    templateId: TemplateId;
    isPriority: boolean;
};

export const TemplateCard = ({ templateId, isPriority }: TemplateCardProps) => {
    const { t } = useTranslation();
    const nameId = `template-name-${templateId}`;

    return (
        <article className='flex flex-col items-center text-center'>
            <Link
                to='/templates/$templateId'
                params={{ templateId }}
                className='group block w-[min(320px,80vw)] rounded-xl sm:w-full'
            >
                <TemplateSheet
                    templateId={templateId}
                    sizes={CARD_SIZES}
                    isPriority={isPriority}
                    className='group-hover:shadow-overlay group-focus-visible:shadow-overlay'
                />
            </Link>
            <h2 id={nameId} className='font-display mt-6 text-xl font-semibold'>
                {t(`templates.${templateId}.name`)}
            </h2>
            <p className='text-muted-foreground mt-2 mb-5 text-sm leading-relaxed'>
                {t(`templates.${templateId}.description`)}
            </p>
            {/* mt-auto lines the buttons up across a row, whatever the description length */}
            <div className='mt-auto flex flex-wrap justify-center gap-3'>
                <PillButton asChild variant='outline'>
                    <Link
                        to='/templates/$templateId'
                        params={{ templateId }}
                        aria-describedby={nameId}
                    >
                        {t('templates.preview')}
                    </Link>
                </PillButton>
                <PillButton asChild>
                    <Link to='/builder' search={{ templateId }} aria-describedby={nameId}>
                        {t('templates.useTemplate')}
                    </Link>
                </PillButton>
            </div>
        </article>
    );
};
