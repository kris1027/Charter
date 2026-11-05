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

type SortableListProps = {
    // The list length only, so a list redraws when an item is added or removed, never on typing
    count: number;
    idPrefix: string;
    strategy: 'vertical' | 'horizontal';
    onMove: (from: number, to: number) => void;
    className?: string;
    children: (index: number, id: string) => ReactNode;
};

// The one drag and drop setup for every list section: pointer drag after 8px, plus keyboard
export const SortableList = ({
    count,
    idPrefix,
    strategy,
    onMove,
    className,
    children,
}: SortableListProps) => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        const move = findMove(idPrefix, count, active.id, over?.id);
        if (move) onMove(move.from, move.to);
    };

    const ids = Array.from({ length: count }, (_, index) => sortableId(idPrefix, index));

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
                items={ids}
                strategy={
                    strategy === 'vertical'
                        ? verticalListSortingStrategy
                        : horizontalListSortingStrategy
                }
            >
                <div className={className}>{ids.map((id, index) => children(index, id))}</div>
            </SortableContext>
        </DndContext>
    );
};
