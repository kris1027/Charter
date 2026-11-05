import type * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// A full screen sheet on the Radix Dialog: it traps focus, closes on Escape and returns focus
// to its trigger. The open animation runs only without prefers-reduced-motion
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetTitle = DialogPrimitive.Title;

type SheetContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
    closeLabel: string;
};

const SheetContent = ({ className, children, closeLabel, ...props }: SheetContentProps) => (
    <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='bg-background/80 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 fixed inset-0 z-50 backdrop-blur-sm' />
        <DialogPrimitive.Content
            aria-describedby={undefined}
            className={cn(
                'bg-background motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:slide-in-from-bottom-4 fixed inset-0 z-50 flex flex-col',
                className,
            )}
            {...props}
        >
            {children}
            <DialogPrimitive.Close
                aria-label={closeLabel}
                className='ring-offset-background focus-visible:ring-ring text-muted-foreground hover:bg-accent hover:text-accent-foreground absolute top-3 right-3 rounded-md p-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            >
                <X className='h-5 w-5' />
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
);

export { Sheet, SheetContent, SheetTitle, SheetTrigger };
