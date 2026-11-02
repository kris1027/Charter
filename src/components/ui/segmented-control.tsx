import type * as React from 'react';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

type SegmentedControlProps = Omit<
    React.ComponentProps<typeof ToggleGroupPrimitive.Root>,
    'type' | 'value' | 'defaultValue' | 'onValueChange'
> & {
    'aria-label': string;
    value: string;
    onValueChange: (value: string) => void;
    size?: 'sm' | 'default';
};

// Radix exposes a single toggle group as a radiogroup with roving focus (arrows move, Space selects)
const SegmentedControl = ({
    className,
    size = 'default',
    onValueChange,
    ...props
}: SegmentedControlProps) => (
    <ToggleGroupPrimitive.Root
        type='single'
        data-slot='segmented-control'
        data-size={size}
        className={cn(
            'bg-muted inline-flex w-fit items-stretch gap-1 rounded-lg p-1 data-[size=default]:h-9 data-[size=sm]:h-8',
            className,
        )}
        // Clicking the selected item reports an empty value; ignore it so a choice is always made
        onValueChange={(value) => {
            if (value) onValueChange(value);
        }}
        {...props}
    />
);

type SegmentedControlItemProps = React.ComponentProps<typeof ToggleGroupPrimitive.Item>;

const SegmentedControlItem = ({ className, ...props }: SegmentedControlItemProps) => (
    <ToggleGroupPrimitive.Item
        data-slot='segmented-control-item'
        className={cn(
            "text-muted-foreground hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-surface ease-standard inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors duration-(--duration-fast) disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            className,
        )}
        {...props}
    />
);

export { SegmentedControl, SegmentedControlItem };
export type { SegmentedControlProps, SegmentedControlItemProps };
