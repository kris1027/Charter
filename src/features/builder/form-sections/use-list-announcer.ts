import { useState } from 'react';

// A message for a list section's own live region. The section renders it in an always mounted
// sr-only role='status' element, because SortableList unmounts when the list becomes empty
export const useListAnnouncer = () => {
    const [message, setMessage] = useState('');

    // A repeated message gets a trailing no break space, so screen readers announce it again
    const announce = (text: string) =>
        setMessage((previous) => (previous === text ? `${text}\u00a0` : text));

    return { message, announce };
};
