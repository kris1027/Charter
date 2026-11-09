import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { GALLERY_CONTAINER_CLASS } from '@/features/gallery/gallery-classes';
import { PillButton } from '@/features/gallery/pill-button';

type GalleryNavProps = {
    backTo: '/' | '/templates';
    backLabel: string;
};

export const GalleryNav = ({ backTo, backLabel }: GalleryNavProps) => (
    <div className='bg-background sticky top-0 z-10 shrink-0 border-b'>
        <div className={`${GALLERY_CONTAINER_CLASS} flex items-center justify-between gap-3 py-3`}>
            <PillButton asChild variant='outline' size='sm' className='min-w-0 shrink'>
                <Link to={backTo}>
                    <ArrowLeft aria-hidden='true' />
                    <span className='truncate'>{backLabel}</span>
                </Link>
            </PillButton>
            <div className='flex shrink-0 items-center gap-2'>
                <LanguageToggle />
                <ThemeToggle />
            </div>
        </div>
    </div>
);
