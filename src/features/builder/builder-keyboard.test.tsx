import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import BuilderPage from '@/features/builder/builder-page';
import { loadResumeFromPDF } from '@/features/pdf/import/load-resume';
import type { ResumeFormValues } from '@/features/resume/form-types';
import {
    EMPTY_EXPERIENCE,
    EMPTY_GDPR_CONSENT,
    EMPTY_PERSONAL_INFO,
} from '@/features/resume/stored-resume';
import { renderWithRouter, screen, userEvent, waitFor, within } from '@/test/test-utils';

vi.mock('@/features/pdf/import/load-resume', () => ({ loadResumeFromPDF: vi.fn() }));

// Spec 0012: the toolbar menu, the section strip, Preview CV and lists without a mouse

const resume = (overrides: Partial<ResumeFormValues> = {}): ResumeFormValues => ({
    templateId: 'developer',
    personalInfo: { ...EMPTY_PERSONAL_INFO },
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    interests: [],
    gdprConsent: { ...EMPTY_GDPR_CONSENT },
    ...overrides,
});

const storeResume = (data: ResumeFormValues) =>
    localStorage.setItem('resumeData', JSON.stringify(data));

const experience = (company: string) => ({ ...EMPTY_EXPERIENCE, company });

const companies = () =>
    screen.getAllByLabelText('Company').map((input) => (input as HTMLInputElement).value);

// The section's own live region; dnd-kit adds one more for dragging, before it
const sectionStatus = (title: string) =>
    within(screen.getByRole('region', { name: title }))
        .getAllByRole('status')
        .at(-1);

describe('builder keyboard and screen reader use', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(loadResumeFromPDF).mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return focus to the actions menu when the reset dialog is cancelled', async () => {
        const user = userEvent.setup();
        await renderWithRouter(BuilderPage);
        const trigger = screen.getByRole('button', { name: 'More actions' });

        await user.click(trigger);
        await user.click(await screen.findByRole('menuitem', { name: 'Reset' }));
        const dialog = await screen.findByRole('alertdialog');
        expect(dialog).toContainElement(document.activeElement as HTMLElement);

        await user.keyboard('{Escape}');

        await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
        expect(trigger).toHaveFocus();
    });

    it('should announce the import in the save status while the PDF loads', async () => {
        const user = userEvent.setup();
        let finish: (value: ResumeFormValues) => void = () => {};
        vi.mocked(loadResumeFromPDF).mockReturnValue(
            new Promise((resolve) => {
                finish = resolve;
            }),
        );
        await renderWithRouter(BuilderPage);

        await user.upload(
            screen.getByLabelText<HTMLInputElement>('Load PDF'),
            new File(['%PDF'], 'resume.pdf', { type: 'application/pdf' }),
        );

        expect(await screen.findByText('Loading...')).toBeInTheDocument();
        finish(resume());
        await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
    });

    it('should show the toast when the form is invalid but no field can take focus', async () => {
        const user = userEvent.setup();
        storeResume(
            resume({
                personalInfo: {
                    ...EMPTY_PERSONAL_INFO,
                    firstName: 'Ada',
                    lastName: 'L',
                    email: 'a@b.co',
                },
                skills: [{ name: 'x'.repeat(101) }],
            }),
        );
        await renderWithRouter(BuilderPage);

        await user.click(screen.getAllByRole('button', { name: 'Preview CV' })[0]);

        expect(
            await screen.findByText(
                'Something in your resume needs fixing before you can preview it.',
            ),
        ).toBeInTheDocument();
    });

    it('should check a section only when it is complete', async () => {
        const user = userEvent.setup();
        await renderWithRouter(BuilderPage);
        const nav = screen.getByRole('navigation', { name: 'Resume sections' });
        const link = (name: RegExp) => within(nav).getByRole('link', { name });

        await user.type(screen.getByLabelText(/^First Name/), 'Ada');
        expect(await screen.findByText('10%')).toBeInTheDocument();
        expect(link(/^Personal/)).not.toHaveTextContent('Completed');

        await user.type(screen.getByPlaceholderText('Enter a skill'), 'Go{Enter}');
        await waitFor(() => expect(link(/^Skills/)).toHaveTextContent('Skills Completed'));
        expect(link(/^GDPR/)).toHaveTextContent(/^GDPR$/);
    });

    it('should focus the section heading and mark the link current when a link is used', async () => {
        const user = userEvent.setup();
        const { router } = await renderWithRouter(BuilderPage);
        const nav = screen.getByRole('navigation', { name: 'Resume sections' });

        await user.click(within(nav).getByRole('link', { name: 'Interests' }));

        expect(screen.getByRole('heading', { level: 2, name: 'Interests' })).toHaveFocus();
        expect(within(nav).getByRole('link', { name: 'Interests' })).toHaveAttribute(
            'aria-current',
            'location',
        );
        expect(router.state.location.hash).toBe('');
    });

    it('should focus the new card first field when an item is added', async () => {
        const user = userEvent.setup();
        await renderWithRouter(BuilderPage);

        await user.click(screen.getByRole('button', { name: 'Add Experience' }));

        await waitFor(() => expect(screen.getByLabelText('Company')).toHaveFocus());
    });

    it('should move a card, keep focus with it and announce the position', async () => {
        const user = userEvent.setup();
        storeResume(resume({ experiences: [experience('A'), experience('B'), experience('C')] }));
        await renderWithRouter(BuilderPage);

        await user.click(screen.getByRole('button', { name: 'Move Experience 2 up' }));

        expect(companies()).toEqual(['B', 'A', 'C']);
        // Experience 1 is first now, so its own Move up is disabled and focus takes Move down
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Move Experience 1 down' })).toHaveFocus(),
        );
        expect(screen.getByRole('button', { name: 'Move Experience 1 up' })).toBeDisabled();
        expect(sectionStatus('Work Experience')).toHaveTextContent('Moved to position 1 of 3');

        await user.click(screen.getByRole('button', { name: 'Move Experience 2 down' }));
        expect(companies()).toEqual(['B', 'C', 'A']);
    });

    it('should announce and focus Add when the only card is removed', async () => {
        const user = userEvent.setup();
        storeResume(resume({ experiences: [experience('Solo')] }));
        await renderWithRouter(BuilderPage);

        await user.click(screen.getByRole('button', { name: 'Remove experience' }));

        expect(screen.getByRole('button', { name: 'Add Experience' })).toHaveFocus();
        expect(sectionStatus('Work Experience')).toHaveTextContent('Removed Experience 1');
    });

    it('should move a chip through its menu and keep focus on its menu button', async () => {
        const user = userEvent.setup();
        storeResume(resume({ skills: [{ name: 'A' }, { name: 'B' }] }));
        await renderWithRouter(BuilderPage);

        await user.click(screen.getByRole('button', { name: 'Actions for A' }));
        expect(await screen.findByRole('menuitem', { name: 'Move left' })).toHaveAttribute(
            'aria-disabled',
            'true',
        );
        await user.click(screen.getByRole('menuitem', { name: 'Move right' }));

        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Actions for A' })).toHaveFocus(),
        );
        const chips = screen.getAllByRole('button', { name: /^Actions for/ });
        expect(chips.map((chip) => chip.getAttribute('aria-label'))).toEqual([
            'Actions for B',
            'Actions for A',
        ]);
        expect(sectionStatus('Skills')).toHaveTextContent('Moved to position 2 of 2');
    });

    it('should announce, focus the input and keep the form when a chip is added or removed', async () => {
        const user = userEvent.setup();
        await renderWithRouter(BuilderPage);
        const input = screen.getByPlaceholderText('Enter an interest');

        await user.type(input, 'Chess{Enter}');
        expect(input).toHaveFocus();
        expect(sectionStatus('Interests')).toHaveTextContent('Added Chess');

        await user.click(screen.getByRole('button', { name: 'Actions for Chess' }));
        await user.click(await screen.findByRole('menuitem', { name: 'Remove interest' }));

        await waitFor(() => expect(input).toHaveFocus());
        expect(sectionStatus('Interests')).toHaveTextContent('Removed Chess');
        expect(input).toHaveAttribute('maxlength', '100');
    });

    it('should scroll a focused field to the nearest edge inside the scroll padding when tabbed to', async () => {
        storeResume(resume({ experiences: [experience('Acme')] }));
        const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
        await renderWithRouter(BuilderPage);
        const description = await screen.findByLabelText('Description');

        scroll.mockClear();
        description.focus();

        // A partly visible field is left alone by the browser's own focus scroll (AC-16)
        expect(scroll).toHaveBeenCalledWith({ block: 'nearest' });
        expect(scroll.mock.contexts.at(-1)).toBe(description);
    });

    it('should leave a section jump to its own scroll when its heading takes focus', async () => {
        await renderWithRouter(BuilderPage);
        const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
        const heading = await screen.findByRole('heading', { name: 'Skills' });

        heading.focus();

        expect(heading).toHaveFocus();
        expect(scroll).not.toHaveBeenCalled();
    });
});
