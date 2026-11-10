import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type Announcements,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { focusByKey } from '@/features/builder/form-sections/focus-field';
import {
    focusKey,
    sortableIds,
    type ItemMoveControls,
} from '@/features/builder/form-sections/sortable-ids';

type SortableListProps = {
    // The list length only, so a list redraws when an item is added or removed, never on typing
    count: number;
    idPrefix: string;
    // Vertical lists hold cards with move buttons, horizontal lists hold chips with a menu
    strategy: 'vertical' | 'horizontal';
    onMove: (from: number, to: number) => void;
    // Reports a move by button or menu to the section's live region
    onAnnounce: (message: string) => void;
    className?: string;
    children: (index: number, id: string, controls: ItemMoveControls) => ReactNode;
};

// The one drag and drop setup for every list section: pointer drag after 8px, plus keyboard,
// plus move buttons for anyone who cannot drag (spec 0012, AC-29 to AC-31, AC-33)
export const SortableList = ({
    count,
    idPrefix,
    strategy,
    onMove,
    onAnnounce,
    className,
    children,
}: SortableListProps) => {
    const { t } = useTranslation();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const ids = sortableIds(idPrefix, count);

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        const move = ids.findMove(active.id, over?.id);
        if (move) onMove(move.from, move.to);
    };

    const position = (id: string | number) => ids.indexOf(id) + 1;
    const announcements: Announcements = {
        onDragStart: ({ active }) =>
            t('accessibility.dragPickedUp', { position: position(active.id) }),
        onDragOver: ({ over }) =>
            over ? t('accessibility.dragOver', { position: position(over.id) }) : undefined,
        onDragEnd: ({ over }) =>
            over
                ? t('accessibility.dragDropped', { position: position(over.id) })
                : t('accessibility.dragCancelled'),
        onDragCancel: () => t('accessibility.dragCancelled'),
    };

    // List keys are index based, so after a move focus goes to the same control at the new index;
    // a card at an end gets the opposite move button, since its own is now disabled
    const move = (from: number, to: number, control: 'moveUp' | 'moveDown') => {
        onMove(from, to);
        onAnnounce(t('builder.reorder.moved', { position: to + 1, total: count }));
        const id = ids.at(to);
        if (strategy === 'horizontal') return focusByKey(focusKey(id, 'menu'));
        const atEnd = control === 'moveUp' ? to === 0 : to === count - 1;
        const target = atEnd ? (control === 'moveUp' ? 'moveDown' : 'moveUp') : control;
        focusByKey(focusKey(id, target));
    };

    const controlsFor = (index: number): ItemMoveControls => ({
        canMoveUp: index > 0,
        canMoveDown: index < count - 1,
        moveUp: () => move(index, index - 1, 'moveUp'),
        moveDown: () => move(index, index + 1, 'moveDown'),
    });

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            accessibility={{
                announcements,
                screenReaderInstructions: { draggable: t('accessibility.dragInstructions') },
            }}
        >
            <SortableContext
                items={ids.all}
                strategy={
                    strategy === 'vertical'
                        ? verticalListSortingStrategy
                        : horizontalListSortingStrategy
                }
            >
                <div className={className}>
                    {ids.all.map((id, index) => children(index, id, controlsFor(index)))}
                </div>
            </SortableContext>
        </DndContext>
    );
};
