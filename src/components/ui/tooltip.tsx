import type * as React from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

type TooltipProps = React.ComponentProps<typeof TooltipPrimitive.Root> & {
    delayDuration?: number;
};

// Each tooltip carries its own provider, so routes without one load nothing extra
const Tooltip = ({ delayDuration = 300, ...props }: TooltipProps) => (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
        <TooltipPrimitive.Root data-slot='tooltip' {...props} />
    </TooltipPrimitive.Provider>
);

type TooltipTriggerProps = React.ComponentProps<typeof TooltipPrimitive.Trigger>;

const TooltipTrigger = (props: TooltipTriggerProps) => (
    <TooltipPrimitive.Trigger data-slot='tooltip-trigger' {...props} />
);

type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Content>;

const TooltipContent = ({ className, sideOffset = 4, ...props }: TooltipContentProps) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            data-slot='tooltip-content'
            sideOffset={sideOffset}
            className={cn(
                'bg-popover text-popover-foreground shadow-overlay z-50 w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) rounded-md border px-3 py-1.5 text-xs text-balance',
                'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                'ease-standard data-[state=closed]:ease-exit duration-(--duration-base)',
                className,
            )}
            {...props}
        />
    </TooltipPrimitive.Portal>
);

export { Tooltip, TooltipTrigger, TooltipContent };
export type { TooltipProps, TooltipTriggerProps, TooltipContentProps };
