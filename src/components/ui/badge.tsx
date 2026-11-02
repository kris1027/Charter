import type * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Solid fills only, so every variant is covered by a contrast pair (spec 0004)
const badgeVariants = cva(
    "inline-flex w-fit shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3",
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground',
                secondary: 'bg-secondary text-secondary-foreground',
                outline: 'text-foreground border',
                success: 'bg-success text-success-foreground',
                warning: 'bg-warning text-warning-foreground',
                info: 'bg-info text-info-foreground',
                destructive: 'bg-destructive text-destructive-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

const Badge = ({ className, variant, ...props }: BadgeProps) => (
    <span
        data-slot='badge'
        data-variant={variant ?? 'default'}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
    />
);

export { Badge };
export type { BadgeProps };
