import type { LucideIcon } from 'lucide-react';

type ListEmptyStateProps = {
    icon: LucideIcon;
    iconGradient: string;
    title: string;
    hint: string;
};

// Shown by a list section with no items, in the section's icon and gradient
export const ListEmptyState = ({ icon: Icon, iconGradient, title, hint }: ListEmptyStateProps) => (
    <div className='py-8 text-center'>
        <div
            className={`mx-auto mb-3 inline-flex rounded-xl bg-gradient-to-br ${iconGradient} p-2.5 text-white/60 shadow-inner`}
        >
            <Icon className='h-6 w-6' />
        </div>
        <p className='font-display font-medium text-slate-500 dark:text-slate-400'>{title}</p>
        <p className='mt-1 text-sm text-slate-400 dark:text-slate-500'>{hint}</p>
    </div>
);
