import { describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { renderWithToaster, screen, userEvent, waitFor } from '@/test/test-utils';
import { dismiss, notify } from './toast';

const show = (options: Parameters<typeof notify>[0]) => {
    act(() => {
        notify(options);
    });
};

describe('Toast', () => {
    it('should label the toast region when the Toaster is mounted', () => {
        renderWithToaster(<div />);

        expect(screen.getByRole('region', { name: /Notifications/ })).toBeInTheDocument();
    });

    it('should render title and description when notify is called', async () => {
        renderWithToaster(<div />);

        show({ id: 'a', variant: 'info', title: 'Saved', description: 'All good' });

        expect(await screen.findByText('Saved')).toBeInTheDocument();
        expect(screen.getByText('All good')).toBeInTheDocument();
    });

    it('should update one toast when notify is called twice with the same id', async () => {
        renderWithToaster(<div />);

        show({ id: 'same', variant: 'info', title: 'First' });
        await screen.findByText('First');
        show({ id: 'same', variant: 'info', title: 'Second' });

        expect(await screen.findByText('Second')).toBeInTheDocument();
        expect(screen.queryByText('First')).not.toBeInTheDocument();
    });

    it('should run the action and close the toast when an action is clicked', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();
        renderWithToaster(<div />);

        show({
            id: 'act',
            variant: 'warning',
            title: 'Careful',
            duration: Infinity,
            dismissible: false,
            actions: [{ label: 'Do it', kind: 'primary', onClick: handleClick }],
        });
        await user.click(await screen.findByRole('button', { name: 'Do it' }));

        expect(handleClick).toHaveBeenCalledOnce();
        await waitFor(() => expect(screen.queryByText('Careful')).not.toBeInTheDocument());
    });

    it('should show a labelled close button only when dismissible', async () => {
        const handleDismiss = vi.fn();
        const user = userEvent.setup();
        renderWithToaster(<div />);

        show({ id: 'fixed', variant: 'info', title: 'Fixed', dismissible: false });
        show({ id: 'loose', variant: 'success', title: 'Loose', onDismiss: handleDismiss });
        await screen.findByText('Fixed');
        await screen.findByText('Loose');

        const closeButtons = screen.getAllByRole('button', { name: 'Close notification' });
        expect(closeButtons).toHaveLength(1);

        await user.click(closeButtons[0]);

        expect(handleDismiss).toHaveBeenCalledOnce();
        await waitFor(() => expect(screen.queryByText('Loose')).not.toBeInTheDocument());
        expect(screen.getByText('Fixed')).toBeInTheDocument();
    });

    it('should remove the toast when dismiss is called with its id', async () => {
        renderWithToaster(<div />);

        show({ id: 'gone', variant: 'destructive', title: 'Gone soon', duration: Infinity });
        await screen.findByText('Gone soon');
        act(() => dismiss('gone'));

        await waitFor(() => expect(screen.queryByText('Gone soon')).not.toBeInTheDocument());
    });
});
