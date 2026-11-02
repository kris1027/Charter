import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Toaster as SonnerToaster, toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ToastVariant = 'info' | 'success' | 'warning' | 'destructive';

type ToastAction = {
    label: string;
    onClick: () => void | Promise<void>;
    kind: 'primary' | 'secondary';
};

type NotifyOptions = {
    // Required so a notice shown twice (re render, StrictMode) updates one toast instead of stacking
    id: string;
    variant: ToastVariant;
    title: string;
    description?: string;
    icon?: LucideIcon;
    actions?: ToastAction[];
    duration?: number;
    dismissible?: boolean;
    onAutoClose?: () => void;
    onDismiss?: () => void;
};

// Literal class strings so Tailwind sees every variant
const VARIANT_CHIP: Record<ToastVariant, string> = {
    info: 'bg-info/15 text-info',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    destructive: 'bg-destructive/15 text-destructive',
};

const VARIANT_ICON: Record<ToastVariant, LucideIcon> = {
    info: Info,
    success: CircleCheck,
    warning: TriangleAlert,
    destructive: CircleAlert,
};

const dismiss = (id: string) => {
    toast.dismiss(id);
};

type ToastCardProps = Omit<NotifyOptions, 'duration' | 'onAutoClose'>;

const ToastCard = ({
    id,
    variant,
    title,
    description,
    icon,
    actions = [],
    dismissible = true,
    onDismiss,
}: ToastCardProps) => {
    const { t } = useTranslation();
    const Icon = icon ?? VARIANT_ICON[variant];

    const handleAction = (action: ToastAction) => {
        void action.onClick();
        dismiss(id);
    };

    const handleClose = () => {
        onDismiss?.();
        dismiss(id);
    };

    return (
        <div
            className={cn(
                'bg-card text-card-foreground shadow-overlay relative flex w-full flex-col gap-3 rounded-lg border p-4 font-sans min-[600px]:w-(--width) sm:flex-row sm:items-center',
                dismissible && 'pr-12',
            )}
        >
            <div className='flex min-w-0 flex-1 items-center gap-3'>
                <span
                    aria-hidden='true'
                    className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full',
                        VARIANT_CHIP[variant],
                    )}
                >
                    <Icon className='size-4' />
                </span>
                <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium'>{title}</p>
                    {description && <p className='text-muted-foreground text-xs'>{description}</p>}
                </div>
            </div>
            {actions.length > 0 && (
                <div className='flex shrink-0 gap-2'>
                    {actions.map((action) => (
                        <Button
                            key={action.label}
                            size='sm'
                            variant={action.kind === 'primary' ? 'default' : 'outline'}
                            onClick={() => handleAction(action)}
                        >
                            {action.label}
                        </Button>
                    ))}
                </div>
            )}
            {dismissible && (
                <Button
                    variant='ghost'
                    size='icon'
                    className='absolute top-2 right-2 size-8'
                    aria-label={t('toast.close')}
                    onClick={handleClose}
                >
                    <X aria-hidden='true' />
                </Button>
            )}
        </div>
    );
};

// Headless: Sonner keeps positioning, stacking, swipe and the live region; the look is ours
const notify = ({ duration = 5000, onAutoClose, ...card }: NotifyOptions) =>
    toast.custom(() => <ToastCard {...card} />, {
        id: card.id,
        duration,
        dismissible: card.dismissible ?? true,
        onAutoClose,
        onDismiss: card.onDismiss,
    });

// Mount once, before anything that calls notify, so its subscription exists first
const Toaster = () => {
    const { t } = useTranslation();

    return (
        <SonnerToaster
            position='bottom-center'
            expand
            visibleToasts={4}
            containerAriaLabel={t('toast.region')}
        />
    );
};

// notify and dismiss live beside the card they render (spec 0004); this file just reloads in full on edit
// eslint-disable-next-line react-refresh/only-export-components
export { Toaster, notify, dismiss };
export type { NotifyOptions, ToastAction, ToastVariant };
