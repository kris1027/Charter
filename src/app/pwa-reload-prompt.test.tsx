import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { flushToasts, renderWithToaster, screen, userEvent, waitFor } from '@/test/test-utils';
import { PwaReloadPrompt } from './pwa-reload-prompt';

const mockSetOfflineReady = vi.fn();
const mockSetNeedRefresh = vi.fn();
const mockUpdateServiceWorker = vi.fn();

let mockOfflineReady = false;
let mockNeedRefresh = false;

vi.mock('@/test/pwa-register-mock', () => ({
    useRegisterSW: () => ({
        offlineReady: [mockOfflineReady, mockSetOfflineReady],
        needRefresh: [mockNeedRefresh, mockSetNeedRefresh],
        updateServiceWorker: mockUpdateServiceWorker,
    }),
}));

describe('PwaReloadPrompt', () => {
    beforeEach(() => {
        mockOfflineReady = false;
        mockNeedRefresh = false;
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should not show a toast when neither offline ready nor needs refresh', async () => {
        renderWithToaster(<PwaReloadPrompt />);
        await flushToasts();

        expect(screen.queryByText('App ready to work offline')).not.toBeInTheDocument();
        expect(screen.queryByText('New version available')).not.toBeInTheDocument();
    });

    it('should show the offline ready toast with only a close button when the app is offline ready', async () => {
        mockOfflineReady = true;

        renderWithToaster(<PwaReloadPrompt />);

        expect(await screen.findByText('App ready to work offline')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Reload' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Close notification' })).toBeInTheDocument();
    });

    it('should reset offline ready when its toast is closed', async () => {
        mockOfflineReady = true;
        const user = userEvent.setup();

        renderWithToaster(<PwaReloadPrompt />);
        await user.click(await screen.findByRole('button', { name: 'Close notification' }));

        await waitFor(() =>
            expect(screen.queryByText('App ready to work offline')).not.toBeInTheDocument(),
        );
        expect(mockSetOfflineReady).toHaveBeenCalledWith(false);
    });

    it('should show the update toast with Reload and Close when a new version is waiting', async () => {
        mockNeedRefresh = true;

        renderWithToaster(<PwaReloadPrompt />);

        expect(await screen.findByText('New version available')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Close notification' }),
        ).not.toBeInTheDocument();
    });

    it('should call updateServiceWorker when Reload is clicked', async () => {
        mockNeedRefresh = true;
        const user = userEvent.setup();

        renderWithToaster(<PwaReloadPrompt />);
        await user.click(await screen.findByRole('button', { name: 'Reload' }));

        expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);
    });

    it('should hide the update toast for this visit when Close is clicked', async () => {
        mockNeedRefresh = true;
        const user = userEvent.setup();

        renderWithToaster(<PwaReloadPrompt />);
        await user.click(await screen.findByRole('button', { name: 'Close' }));

        expect(mockSetNeedRefresh).toHaveBeenCalledWith(false);
        await waitFor(() =>
            expect(screen.queryByText('New version available')).not.toBeInTheDocument(),
        );
    });

    it('should auto close the offline ready toast when 5 seconds pass', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        mockOfflineReady = true;

        renderWithToaster(<PwaReloadPrompt />);
        await screen.findByText('App ready to work offline');

        act(() => {
            vi.advanceTimersByTime(5000);
        });

        await waitFor(() => expect(mockSetOfflineReady).toHaveBeenCalledWith(false));
    });
});
