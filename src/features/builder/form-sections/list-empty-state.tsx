import type { LucideIcon } from 'lucide-react';

type ListEmptyStateProps = {
    icon: LucideIcon;
    title: string;
    hint: string;
};

// Shown by a list section with no items, with the section's icon
export const ListEmptyState = ({ icon: Icon, title, hint }: ListEmptyStateProps) => (
    <div className='py-8 text-center'>
        <div
            className='bg-muted text-muted-foreground mx-auto mb-3 inline-flex rounded-lg p-2.5'
            aria-hidden='true'
        >
            <Icon className='size-6' />
        </div>
        <p className='font-display text-foreground font-medium'>{title}</p>
        <p className='text-muted-foreground mt-1 text-sm'>{hint}</p>
    </div>
);
