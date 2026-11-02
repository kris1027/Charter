import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { flushToasts, renderWithToaster, screen, waitFor } from '@/test/test-utils';
import { OfflineIndicator } from './offline-indicator';

const MESSAGE = "You're offline — all features still work";

const setOnLine = (value: boolean) => {
    Object.defineProperty(navigator, 'onLine', { value, writable: true, configurable: true });
};

describe('OfflineIndicator', () => {
    const originalOnLine = navigator.onLine;

    beforeEach(() => {
        setOnLine(true);
    });

    afterEach(() => {
        setOnLine(originalOnLine);
    });

    it('should not show a toast when online', async () => {
        renderWithToaster(<OfflineIndicator />);
        await flushToasts();

        expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument();
    });

    it('should show the warning toast when the page loads offline', async () => {
        setOnLine(false);

        renderWithToaster(<OfflineIndicator />);

        expect(await screen.findByText(MESSAGE)).toBeInTheDocument();
    });

    it('should show the warning toast when going offline', async () => {
        renderWithToaster(<OfflineIndicator />);

        act(() => {
            setOnLine(false);
            window.dispatchEvent(new Event('offline'));
        });

        expect(await screen.findByText(MESSAGE)).toBeInTheDocument();
    });

    it('should remove the toast and show no other when coming back online', async () => {
        setOnLine(false);
        renderWithToaster(<OfflineIndicator />);
        await screen.findByText(MESSAGE);

        act(() => {
            setOnLine(true);
            window.dispatchEvent(new Event('online'));
        });

        await waitFor(() => expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument());
        await flushToasts();
        expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });
});
