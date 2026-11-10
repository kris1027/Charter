import { useRef } from 'react';

// For a menu item whose action places focus itself (a dialog opens, an item moves): Radix must
// not send focus back to the menu's trigger when the menu closes (spec 0012, AC-8, AC-31).
// Wrap such an item's handler in `placesFocus`, and pass `onCloseAutoFocus` to the menu content
export const useMenuActionFocus = () => {
    const actionChosen = useRef(false);

    const placesFocus = (action: () => void) => () => {
        actionChosen.current = true;
        action();
    };

    const onCloseAutoFocus = (event: Event) => {
        if (!actionChosen.current) return;
        actionChosen.current = false;
        event.preventDefault();
    };

    return { placesFocus, onCloseAutoFocus };
};
