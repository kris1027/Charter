import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ReactNode } from 'react';
import { findMove, sortableId } from '@/features/builder/form-sections/sortable-ids';

type SortableListProps<T> = {
    items: T[];
    idPrefix: string;
    strategy: 'vertical' | 'horizontal';
    onMove: (from: number, to: number) => void;
    className?: string;
    children: (item: T, index: number, id: string) => ReactNode;
};

// The one drag and drop setup for every list section: pointer drag after 8px, plus keyboard
export const SortableList = <T,>({
    items,
    idPrefix,
    strategy,
    onMove,
    className,
    children,
}: SortableListProps<T>) => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        const move = findMove(idPrefix, items.length, active.id, over?.id);
        if (move) onMove(move.from, move.to);
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
                items={items.map((_, index) => sortableId(idPrefix, index))}
                strategy={
                    strategy === 'vertical'
                        ? verticalListSortingStrategy
                        : horizontalListSortingStrategy
                }
            >
                <div className={className}>
                    {items.map((item, index) => children(item, index, sortableId(idPrefix, index)))}
                </div>
            </SortableContext>
        </DndContext>
    );
};
