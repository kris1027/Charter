import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { sectionAnchor, type BuilderSectionId } from '@/features/builder/builder-sections';

type FormSectionCardProps = {
    sectionId: BuilderSectionId;
    icon: LucideIcon;
    title: string;
    description: string;
    headerAction?: ReactNode;
    children: ReactNode;
};

// One form section: the section strip scrolls to it and focuses its h2 (spec 0012, AC-14, AC-17)
export const FormSectionCard = ({
    sectionId,
    icon: Icon,
    title,
    description,
    headerAction,
    children,
}: FormSectionCardProps) => {
    const anchor = sectionAnchor(sectionId);
    const titleId = `${anchor}-title`;

    return (
        <section
            id={anchor}
            aria-labelledby={titleId}
            className='bg-card text-card-foreground shadow-surface rounded-xl border'
        >
            <div className='flex flex-wrap items-start justify-between gap-4 p-4 pb-0 sm:p-6 sm:pb-0'>
                <div className='flex min-w-0 items-start gap-3'>
                    <div
                        className='bg-accent text-primary inline-flex shrink-0 rounded-lg p-2.5'
                        aria-hidden='true'
                    >
                        <Icon className='size-5' />
                    </div>
                    <div className='min-w-0'>
                        <h2
                            id={titleId}
                            tabIndex={-1}
                            className='font-display text-xl font-semibold tracking-tight'
                        >
                            {title}
                        </h2>
                        <p className='text-muted-foreground mt-0.5 text-sm'>{description}</p>
                    </div>
                </div>
                {headerAction && <div className='shrink-0'>{headerAction}</div>}
            </div>

            <div className='p-4 sm:p-6'>{children}</div>
        </section>
    );
};
