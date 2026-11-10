import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    EllipsisVertical,
    GripVertical,
    Trash2,
} from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { focusKey, type ItemMoveControls } from '@/features/builder/form-sections/sortable-ids';
import {
    useSortableItem,
    type HandleProps,
} from '@/features/builder/form-sections/use-sortable-item';

type DragHandleProps = {
    handleProps: HandleProps;
    size: 'sm' | 'md';
};

// sm for chips (skills, interests), md for cards; both at least 24 by 24 (spec 0012, AC-32)
export const DragHandle = ({ handleProps, size }: DragHandleProps) => {
    const { t } = useTranslation();

    return (
        <button
            type='button'
            className={`text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex shrink-0 cursor-grab touch-none items-center justify-center rounded-md transition-colors duration-(--duration-fast) active:cursor-grabbing ${size === 'sm' ? 'size-6' : 'size-8'}`}
            aria-label={t('accessibility.dragToReorder')}
            {...handleProps.attributes}
            {...handleProps.listeners}
        >
            <GripVertical className={size === 'sm' ? 'size-3.5' : 'size-5'} aria-hidden='true' />
        </button>
    );
};

const DRAGGING_CLASSES = 'shadow-overlay ring-2 ring-ring';

type SortableCardProps = {
    id: string;
    title: string;
    removeLabel: string;
    onRemove: () => void;
    controls: ItemMoveControls;
    className?: string;
    children: ReactNode;
};

// Card for experience, education and languages: drag handle, title, move and remove, fields
export const SortableCard = ({
    id,
    title,
    removeLabel,
    onRemove,
    controls,
    className = '',
    children,
}: SortableCardProps) => {
    const { t } = useTranslation();
    const { setNodeRef, style, isDragging, handleProps } = useSortableItem(id);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${className} bg-background rounded-lg border p-4 sm:p-5 ${isDragging ? DRAGGING_CLASSES : ''}`}
        >
            <div className='mb-4 flex items-center justify-between gap-2'>
                <div className='flex min-w-0 items-center gap-2'>
                    <DragHandle handleProps={handleProps} size='md' />
                    <h3 className='font-display truncate text-base font-semibold'>{title}</h3>
                </div>
                <div className='flex shrink-0 items-center gap-1'>
                    <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-8'
                        onClick={controls.moveUp}
                        disabled={!controls.canMoveUp}
                        aria-label={t('accessibility.moveUp', { item: title })}
                        data-focus-key={focusKey(id, 'moveUp')}
                    >
                        <ArrowUp aria-hidden='true' />
                    </Button>
                    <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-8'
                        onClick={controls.moveDown}
                        disabled={!controls.canMoveDown}
                        aria-label={t('accessibility.moveDown', { item: title })}
                        data-focus-key={focusKey(id, 'moveDown')}
                    >
                        <ArrowDown aria-hidden='true' />
                    </Button>
                    <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='hover:text-destructive size-8'
                        onClick={onRemove}
                        aria-label={removeLabel}
                    >
                        <Trash2 aria-hidden='true' />
                    </Button>
                </div>
            </div>
            {children}
        </div>
    );
};

type SortableChipProps = {
    id: string;
    name: string;
    removeLabel: string;
    onRemove: () => void;
    controls: ItemMoveControls;
};

// Chip for skills and interests: drag handle, name, and a menu that moves or removes it, so
// every action works by touch and keyboard (spec 0012, AC-30)
export const SortableChip = ({ id, name, removeLabel, onRemove, controls }: SortableChipProps) => {
    const { t } = useTranslation();
    const { setNodeRef, style, isDragging, handleProps } = useSortableItem(id);
    // An action places focus itself, so Radix must not send it back to this index's trigger
    const actionChosen = useRef(false);
    const choose = (action: () => void) => () => {
        actionChosen.current = true;
        action();
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-background flex items-center gap-1 rounded-full border py-1 pr-1 pl-1.5 ${isDragging ? DRAGGING_CLASSES : ''}`}
        >
            <DragHandle handleProps={handleProps} size='sm' />
            <span className='px-1 text-sm font-medium'>{name}</span>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <button
                        type='button'
                        className='text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-(--duration-fast)'
                        aria-label={t('accessibility.itemActions', { item: name })}
                        data-focus-key={focusKey(id, 'menu')}
                    >
                        <EllipsisVertical className='size-3.5' aria-hidden='true' />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align='start'
                    onCloseAutoFocus={(event) => {
                        if (!actionChosen.current) return;
                        actionChosen.current = false;
                        event.preventDefault();
                    }}
                >
                    <DropdownMenuItem
                        className='gap-2'
                        disabled={!controls.canMoveUp}
                        onSelect={choose(controls.moveUp)}
                    >
                        <ArrowLeft className='size-4' aria-hidden='true' />
                        {t('accessibility.moveLeft')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className='gap-2'
                        disabled={!controls.canMoveDown}
                        onSelect={choose(controls.moveDown)}
                    >
                        <ArrowRight className='size-4' aria-hidden='true' />
                        {t('accessibility.moveRight')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className='text-destructive focus:text-destructive gap-2'
                        onSelect={choose(onRemove)}
                    >
                        <Trash2 className='size-4' aria-hidden='true' />
                        {removeLabel}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
