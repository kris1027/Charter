import { useState } from 'react';
import { safeStorage } from '@/lib/storage';

export const PREVIEW_OPEN_KEY = 'builderPreviewOpen';

// Whether the wide screen preview panel is shown: '1' open, '0' hidden, missing means open
export const usePreviewOpen = () => {
    const [open, setOpen] = useState(() => safeStorage.getItem(PREVIEW_OPEN_KEY) !== '0');

    const toggle = () => {
        const next = !open;
        safeStorage.setItem(PREVIEW_OPEN_KEY, next ? '1' : '0');
        setOpen(next);
    };

    return { open, toggle };
};
