import { GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { HandleProps } from '@/features/builder/form-sections/use-sortable-item';

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
