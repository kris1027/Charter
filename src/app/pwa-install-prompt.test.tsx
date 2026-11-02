import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { renderWithToaster, screen, userEvent, waitFor } from '@/test/test-utils';
import { PwaInstallPrompt } from './pwa-install-prompt';
import { safeStorage } from '@/lib/storage';

const TITLE = 'Install app';

const flushToasts = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)));

const fireBeforeInstallPrompt = (outcome: 'accepted' | 'dismissed' = 'accepted') => {
    const promptEvent = new Event('beforeinstallprompt') as Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };
    promptEvent.prompt = vi.fn().mockResolvedValue(undefined);
    promptEvent.userChoice = Promise.resolve({ outcome });
    act(() => {
        window.dispatchEvent(promptEvent);
    });
    return promptEvent;
};

describe('PwaInstallPrompt', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should not show a toast when no beforeinstallprompt event has fired', async () => {
        renderWithToaster(<PwaInstallPrompt />);
        await flushToasts();

        expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
    });

    it('should show the install toast when beforeinstallprompt fires', async () => {
        renderWithToaster(<PwaInstallPrompt />);

        fireBeforeInstallPrompt();

        expect(await screen.findByText(TITLE)).toBeInTheDocument();
        expect(
            screen.getByText('Install Resume Builder for quick access and offline use'),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should not show a toast when previously dismissed', async () => {
        safeStorage.setItem('pwaInstallDismissed', 'true');

        renderWithToaster(<PwaInstallPrompt />);
        fireBeforeInstallPrompt();
        await flushToasts();

        expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
    });

    it('should open the prompt and close without saving the flag when Install is picked', async () => {
        const user = userEvent.setup();
        renderWithToaster(<PwaInstallPrompt />);
        const promptEvent = fireBeforeInstallPrompt('dismissed');

        await user.click(await screen.findByRole('button', { name: 'Install' }));

        expect(promptEvent.prompt).toHaveBeenCalled();
        await waitFor(() => expect(screen.queryByText(TITLE)).not.toBeInTheDocument());
        expect(safeStorage.getItem('pwaInstallDismissed')).toBeNull();
    });

    it('should persist dismissal and close when Close is clicked', async () => {
        const user = userEvent.setup();
        renderWithToaster(<PwaInstallPrompt />);
        fireBeforeInstallPrompt();

        await user.click(await screen.findByRole('button', { name: 'Close' }));

        await waitFor(() => expect(screen.queryByText(TITLE)).not.toBeInTheDocument());
        expect(safeStorage.getItem('pwaInstallDismissed')).toBe('true');
    });

    it('should close the toast when the app gets installed', async () => {
        renderWithToaster(<PwaInstallPrompt />);
        fireBeforeInstallPrompt();
        await screen.findByText(TITLE);

        act(() => {
            window.dispatchEvent(new Event('appinstalled'));
        });

        await waitFor(() => expect(screen.queryByText(TITLE)).not.toBeInTheDocument());
    });
});
