import { useSyncExternalStore } from 'react';

// Live matchMedia result; re-renders only when the match flips
export const useMediaQuery = (query: string): boolean =>
    useSyncExternalStore(
        (onChange) => {
            const list = window.matchMedia(query);
            list.addEventListener('change', onChange);
            return () => list.removeEventListener('change', onChange);
        },
        () => window.matchMedia(query).matches,
        () => false,
    );
