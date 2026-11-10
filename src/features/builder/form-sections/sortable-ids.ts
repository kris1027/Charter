type Move = { from: number; to: number };

// The sortable ids of one list of `count` items. List items have no id of their own, so an id is
// `${prefix}-${index}` and a drag maps straight back to array indexes. Only this module reads or
// writes that format
export type SortableIds = {
    // Every id, in list order
    all: string[];
    at: (index: number) => string;
    // The index inside an id, or -1 when the id is not from this list
    indexOf: (id: string | number) => number;
    // The array move for a drop, or null when nothing moves
    findMove: (activeId: string | number, overId: string | number | undefined) => Move | null;
};

export const sortableIds = (prefix: string, count: number): SortableIds => {
    const at = (index: number) => `${prefix}-${index}`;

    const indexOf = (id: string | number) => {
        const text = String(id);
        if (!text.startsWith(`${prefix}-`)) return -1;
        const index = Number(text.slice(prefix.length + 1));
        return Number.isInteger(index) && index >= 0 && index < count ? index : -1;
    };

    const findMove = (activeId: string | number, overId: string | number | undefined) => {
        if (overId === undefined || activeId === overId) return null;
        const from = indexOf(activeId);
        const to = indexOf(overId);
        return from === -1 || to === -1 ? null : { from, to };
    };

    return { all: Array.from({ length: count }, (_, index) => at(index)), at, indexOf, findMove };
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
