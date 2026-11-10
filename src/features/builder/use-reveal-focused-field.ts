import { useEffect } from 'react';

// Controls only: section headings get focus with preventScroll during a smooth jump (AC-14),
// and scrolling them here would cancel that jump
const FIELD_SELECTOR = 'input, textarea, select, button';

// Browsers scroll a focused field only when its caret or box is out of view, so a tall field
// that is partly visible stays under the floating Preview button. `block: 'nearest'` honours
// the page's scroll-padding and does nothing when the field already sits inside it
// (spec 0012, AC-16)
export const useRevealFocusedField = () => {
    useEffect(() => {
        const handleFocusIn = (event: FocusEvent) => {
            const target = event.target;
            if (!(target instanceof HTMLElement) || !target.matches(FIELD_SELECTOR)) return;
            if (!target.closest('[data-builder-page] form')) return;
            target.scrollIntoView?.({ block: 'nearest' });
        };
        document.addEventListener('focusin', handleFocusIn);
        return () => document.removeEventListener('focusin', handleFocusIn);
    }, []);
};
