import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

type GalleryNavProps = {
    backTo: '/' | '/templates';
    backLabel: string;
};

export const GalleryNav = ({ backTo, backLabel }: GalleryNavProps) => (
    <div className='bg-background sticky top-0 z-10 shrink-0 border-b'>
        <div className='mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-6 py-3'>
            <Button asChild variant='outline' size='sm' className='min-w-0 shrink rounded-full'>
                <Link to={backTo}>
                    <ArrowLeft aria-hidden='true' />
                    <span className='truncate'>{backLabel}</span>
                </Link>
            </Button>
            <div className='flex shrink-0 items-center gap-2'>
                <LanguageToggle />
                <ThemeToggle />
            </div>
        </div>
    </div>
);
