import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/features/gallery/pill-button';
import { loadStoredResume, readLastSaved } from '@/features/resume/stored-resume';
import { normalizeLang } from '@/lib/app-lang';
import { formatTimeAgo } from '@/lib/date-format';

const readSavedState = () => (loadStoredResume() ? { lastSaved: readLastSaved() } : null);

// Read during the first render, so the notice never pushes the cards down
export const SavedResumeNotice = () => {
    const { t, i18n } = useTranslation();
    const [saved] = useState(readSavedState);
    if (!saved) return null;

    const { lastSaved } = saved;
    const time = lastSaved
        ? (formatTimeAgo(lastSaved, normalizeLang(i18n.language)) ?? t('savedData.justNow'))
        : null;

    return (
        <Card className='mb-14 gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between'>
            <div>
                <p className='font-medium'>{t('savedData.title')}</p>
                {time && (
                    <p className='text-muted-foreground text-sm'>
                        {t('savedData.lastSaved', { time })}
                    </p>
                )}
            </div>
            {/* No templateId: the builder keeps the stored template */}
            <PillButton asChild className='shrink-0 self-start sm:self-auto'>
                <Link to='/builder'>{t('savedData.continue')}</Link>
            </PillButton>
        </Card>
    );
};
