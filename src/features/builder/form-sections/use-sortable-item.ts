import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties } from 'react';

export type HandleProps = {
    attributes: DraggableAttributes;
    listeners: DraggableSyntheticListeners;
};

export const useSortableItem = (id: string) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        position: 'relative',
    };

    const handleProps: HandleProps = { attributes, listeners };

    return { setNodeRef, style, isDragging, handleProps };
};
