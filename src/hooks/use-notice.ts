import { useEffect } from 'react';
import { dismiss, notify, type NotifyOptions } from '@/components/ui/toast';

type Notice = Omit<NotifyOptions, 'id'>;

// Shows the toast while notice is set and dismisses it once notice turns null, never in a
// cleanup (StrictMode would show, dismiss and show the same id). Same id, so a re-notify updates in place
export const useNotice = (id: string, notice: Notice | null) => {
    useEffect(() => {
        if (!notice) {
            dismiss(id);
            return;
        }
        notify({ id, ...notice });
    }, [id, notice]);
};
