// Sortable ids are `${prefix}-${index}`, so a drag maps back to array indexes
export const sortableId = (prefix: string, index: number) => `${prefix}-${index}`;

// The index inside a sortable id, or -1 when the id is not from this list
export const sortableIndex = (prefix: string, id: string | number): number => {
    const text = String(id);
    if (!text.startsWith(`${prefix}-`)) return -1;
    const index = Number(text.slice(prefix.length + 1));
    return Number.isInteger(index) && index >= 0 ? index : -1;
};

export const findMove = (
    prefix: string,
    count: number,
    activeId: string | number,
    overId: string | number | undefined,
): { from: number; to: number } | null => {
    if (overId === undefined || activeId === overId) return null;
    const from = sortableIndex(prefix, activeId);
    const to = sortableIndex(prefix, overId);
    return from === -1 || to === -1 || from >= count || to >= count ? null : { from, to };
};

// The controls a move button or chip menu item finds again after a move (spec 0012, AC-31)
export type MoveControlName = 'moveUp' | 'moveDown' | 'menu';
export const focusKey = (id: string, control: MoveControlName) => `${id}:${control}`;

// What a list item needs to move without dragging (spec 0012, AC-29, AC-30)
export type ItemMoveControls = {
    canMoveUp: boolean;
    canMoveDown: boolean;
    moveUp: () => void;
    moveDown: () => void;
};

// The default for withForm props; SortableList always passes real controls
export const NO_MOVE_CONTROLS: ItemMoveControls = {
    canMoveUp: false,
    canMoveDown: false,
    moveUp: () => {},
    moveDown: () => {},
};
