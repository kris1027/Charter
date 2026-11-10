// Field ids and list keys are index based, so a new or moved item renders on the next pass:
// both helpers wait one animation frame before they look for it (spec 0012, AC-27, AC-31)
export const focusField = (id: string) => {
    requestAnimationFrame(() => document.getElementById(id)?.focus());
};

// Move buttons and chip menu triggers carry data-focus-key; a chip trigger keeps Radix's own id.
// Keys are built from sortable ids and control names, so they never hold a quote
export const focusByKey = (key: string) => {
    requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-focus-key="${key}"]`)?.focus();
    });
};
