// Sortable ids are `${prefix}-${index}`, so a drag maps back to array indexes
export const sortableId = (prefix: string, index: number) => `${prefix}-${index}`;

export const findMove = (
    prefix: string,
    count: number,
    activeId: string | number,
    overId: string | number | undefined,
): { from: number; to: number } | null => {
    if (overId === undefined || activeId === overId) return null;
    const ids = Array.from({ length: count }, (_, index) => sortableId(prefix, index));
    const from = ids.indexOf(String(activeId));
    const to = ids.indexOf(String(overId));
    return from === -1 || to === -1 ? null : { from, to };
};
