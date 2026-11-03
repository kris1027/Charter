import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useSortableItem,
    type HandleProps,
} from '@/features/builder/form-sections/use-sortable-item';

type DragHandleProps = {
    handleProps: HandleProps;
    size: 'sm' | 'md';
};

// sm for chips (skills, interests), md for cards
export const DragHandle = ({ handleProps, size }: DragHandleProps) => {
    const { t } = useTranslation();

    return (
        <button
            type='button'
            className={`cursor-grab touch-none rounded ${size === 'sm' ? 'p-0.5' : 'p-1'} transition-colors hover:bg-slate-100 active:cursor-grabbing dark:hover:bg-white/10`}
            aria-label={t('accessibility.dragToReorder')}
            {...handleProps.attributes}
            {...handleProps.listeners}
        >
            <GripVertical className={`${size === 'sm' ? 'h-3 w-3' : 'h-5 w-5'} text-slate-400`} />
        </button>
    );
};

const DRAGGING_CLASSES = 'shadow-lg ring-2 ring-indigo-500/20';

type SortableCardProps = {
    id: string;
    title: string;
    removeLabel: string;
    onRemove: () => void;
    className?: string;
    children: ReactNode;
};

// Card for experience, education and languages: drag handle, title, remove button, fields
export const SortableCard = ({
    id,
    title,
    removeLabel,
    onRemove,
    className = '',
    children,
}: SortableCardProps) => {
    const { setNodeRef, style, isDragging, handleProps } = useSortableItem(id);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${className} rounded-xl border border-slate-200/60 bg-white/40 p-6 backdrop-blur-sm transition-all hover:shadow-md dark:border-white/5 dark:bg-white/[0.02] dark:hover:shadow-indigo-500/5 ${isDragging ? DRAGGING_CLASSES : ''}`}
        >
            <div className='mb-4 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <DragHandle handleProps={handleProps} size='md' />
                    <h4 className='font-display text-lg font-semibold text-slate-700 dark:text-slate-300'>
                        {title}
                    </h4>
                </div>
                <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={onRemove}
                    className='text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                    aria-label={removeLabel}
                >
                    <Trash2 className='h-4 w-4' />
                </Button>
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
};

// Chip for skills and interests
export const SortableChip = ({ id, name, removeLabel, onRemove }: SortableChipProps) => {
    const { setNodeRef, style, isDragging, handleProps } = useSortableItem(id);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-1 rounded-full border border-slate-200/60 bg-white/60 px-3 py-1.5 backdrop-blur-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-white/[0.05] dark:hover:shadow-indigo-500/5 ${isDragging ? DRAGGING_CLASSES : ''}`}
        >
            <DragHandle handleProps={handleProps} size='sm' />
            <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>{name}</span>
            <button
                type='button'
                onClick={onRemove}
                className='opacity-0 transition-opacity group-hover:opacity-100'
                aria-label={removeLabel}
            >
                <X className='h-3 w-3 text-slate-400 hover:text-red-500' />
            </button>
        </div>
    );
};
