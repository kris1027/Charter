import { Link } from '@tanstack/react-router';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { TemplateId } from '@/lib/template-ids';

type PreviewEmptyStateProps = { templateId: TemplateId };

// Shown when nothing is saved (spec 0013, AC-25): a way to start, and no worker
export const PreviewEmptyState = ({ templateId }: PreviewEmptyStateProps) => {
    const { t } = useTranslation();

    return (
        <div className='bg-muted flex flex-1 items-start justify-center px-4 py-16 md:py-24'>
            <section className='bg-card text-card-foreground shadow-surface w-full max-w-md rounded-xl border p-8 text-center'>
                <div className='bg-muted text-muted-foreground mx-auto mb-5 flex size-12 items-center justify-center rounded-full'>
                    <FileText aria-hidden='true' className='size-6' />
                </div>
                <h2 className='font-display text-xl font-semibold'>{t('preview.noData')}</h2>
                <p className='text-muted-foreground mt-2 text-sm'>{t('preview.noDataHint')}</p>
                <div className='mt-6 flex flex-col gap-2'>
                    <Button asChild>
                        <Link to='/builder' search={{ templateId }}>
                            {t('preview.startBuilding')}
                        </Link>
                    </Button>
                    <Button asChild variant='outline'>
                        <Link to='/templates'>{t('preview.chooseTemplate')}</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
};
