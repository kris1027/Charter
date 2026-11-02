import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { renderWithToaster, screen, userEvent, waitFor } from '@/test/test-utils';
import { PrivacyNotice } from './privacy-notice';
import { safeStorage } from '@/lib/storage';

const TITLE = 'Your data stays private';

// Lets Sonner's timers run so a toast that should not appear has had its chance
const flushToasts = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)));

describe('PrivacyNotice', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should show the privacy toast when not previously accepted', async () => {
        renderWithToaster(<PrivacyNotice />);

        expect(await screen.findByText(TITLE)).toBeInTheDocument();
        expect(
            screen.getByText(
                'All your resume data is stored locally in your browser. Nothing is sent to any server.',
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument();
    });

    it('should offer no close button when shown, so Accept is the only way out', async () => {
        renderWithToaster(<PrivacyNotice />);

        await screen.findByText(TITLE);

        expect(
            screen.queryByRole('button', { name: 'Close notification' }),
        ).not.toBeInTheDocument();
    });

    it('should not show the privacy toast when previously accepted', async () => {
        safeStorage.setItem('privacyNoticeAccepted', 'true');

        renderWithToaster(<PrivacyNotice />);
        await flushToasts();

        expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
    });

    it('should dismiss and persist acceptance when "Got it" is clicked', async () => {
        renderWithToaster(<PrivacyNotice />);

        const user = userEvent.setup();
        await user.click(await screen.findByRole('button', { name: 'Got it' }));

        await waitFor(() => expect(screen.queryByText(TITLE)).not.toBeInTheDocument());
        expect(safeStorage.getItem('privacyNoticeAccepted')).toBe('true');
    });

    it('should show exactly one toast when rendered in StrictMode', async () => {
        renderWithToaster(<PrivacyNotice />, { reactStrictMode: true });

        await screen.findByText(TITLE);
        await flushToasts();

        expect(screen.getAllByText(TITLE)).toHaveLength(1);
    });
});
