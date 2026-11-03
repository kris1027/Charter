import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import BuilderPage from '@/features/builder/builder-page';
import { loadResumeFromPDF } from '@/features/pdf/pdf-parser';
import type { ResumeFormValues } from '@/features/resume/form-types';
import { EMPTY_GDPR_CONSENT, EMPTY_PERSONAL_INFO } from '@/features/resume/stored-resume';
import { renderWithRouter, screen, userEvent, waitFor } from '@/test/test-utils';

vi.mock('@/features/pdf/pdf-parser', () => ({ loadResumeFromPDF: vi.fn() }));

// Characterization suite (spec 0005, AC-1): written against the old page, kept unchanged
// through the split. Later steps only add cases.

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

const experience = (company: string) => ({
    company,
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
});

const storeResume = (data: ResumeFormValues) =>
    localStorage.setItem('resumeData', JSON.stringify(data));

const storedResume = (): ResumeFormValues => JSON.parse(localStorage.getItem('resumeData') ?? '');

const valuesOf = (label: string | RegExp) =>
    screen.getAllByLabelText(label).map((input) => (input as HTMLInputElement).value);

const firstNameInput = () => screen.getByLabelText(/^First Name/);
const lastNameInput = () => screen.getByLabelText(/^Last Name/);
const emailInput = () => screen.getByLabelText(/^Email/);
const previewButton = () => screen.getByRole('button', { name: /Preview CV/ });

const fileInput = (container: HTMLElement) =>
    container.querySelector<HTMLInputElement>('input[type="file"]')!;

const pdfFile = (size?: number) => {
    const file = new File(['%PDF'], 'resume.pdf', { type: 'application/pdf' });
    if (size !== undefined) Object.defineProperty(file, 'size', { value: size });
    return file;
};

describe('BuilderPage', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(loadResumeFromPDF).mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should load the stored resume when one is saved', async () => {
        storeResume(
            resume({ personalInfo: { ...EMPTY_PERSONAL_INFO, firstName: 'Ada', lastName: 'L' } }),
        );

        await renderWithRouter(BuilderPage);

        expect(firstNameInput()).toHaveValue('Ada');
        expect(lastNameInput()).toHaveValue('L');
    });

    it('should use the URL template over the stored one when templateId is in the URL', async () => {
        const user = userEvent.setup();
        storeResume(resume({ templateId: 'default' }));

        await renderWithRouter(BuilderPage, { initialEntry: '/builder?templateId=veterinary' });
        expect(screen.getByText('Veterinary Template')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Save' }));
        expect(storedResume().templateId).toBe('veterinary');
    });

    it('should add an experience first when Add Experience is clicked', async () => {
        const user = userEvent.setup();
        storeResume(resume({ experiences: [experience('Acme')] }));
        await renderWithRouter(BuilderPage);

        await user.click(screen.getByRole('button', { name: 'Add Experience' }));

        expect(valuesOf('Company')).toEqual(['', 'Acme']);
    });

    it('should add education last when Add Education is clicked', async () => {
        const user = userEvent.setup();
        storeResume(
            resume({
                education: [
                    {
                        institution: 'MIT',
                        degree: '',
                        field: '',
                        startDate: '',
                        endDate: '',
                        description: '',
                    },
                ],
            }),
        );
        await renderWithRouter(BuilderPage);

        await user.click(screen.getByRole('button', { name: 'Add Education' }));

        expect(valuesOf('Institution')).toEqual(['MIT', '']);
    });

    it('should add a language last when Add Language is clicked', async () => {
        const user = userEvent.setup();
        storeResume(resume({ languages: [{ language: 'English', proficiency: 'C1' }] }));
        await renderWithRouter(BuilderPage);

        await user.click(screen.getByRole('button', { name: 'Add Language' }));

        expect(screen.getByText('Language 2')).toBeInTheDocument();
        expect(screen.getByDisplayValue('English')).toBeInTheDocument();
        expect(screen.getByText('Language 1')).toBeInTheDocument();
    });

    it('should add a skill on Enter and clear the input when the input is not blank', async () => {
        const user = userEvent.setup();
        await renderWithRouter(BuilderPage);
        const input = screen.getByPlaceholderText('Enter a skill');

        await user.type(input, '   {Enter}');
        expect(screen.queryAllByRole('button', { name: 'Remove skill' })).toHaveLength(0);

        await user.type(input, ' React {Enter}');
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(input).toHaveValue('');
        expect(screen.getAllByRole('button', { name: 'Remove skill' })).toHaveLength(1);
    });

    it('should add an interest on Enter and clear the input when the input is not blank', async () => {
        const user = userEvent.setup();
        await renderWithRouter(BuilderPage);
        const input = screen.getByPlaceholderText('Enter an interest');

        await user.type(input, '{Enter}');
        expect(screen.queryAllByRole('button', { name: 'Remove interest' })).toHaveLength(0);

        await user.type(input, 'Chess{Enter}');
        expect(screen.getByText('Chess')).toBeInTheDocument();
        expect(input).toHaveValue('');
    });

    it('should remove exactly that item when its remove button is clicked', async () => {
        const user = userEvent.setup();
        storeResume(
            resume({
                experiences: [experience('First'), experience('Second')],
                skills: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
            }),
        );
        await renderWithRouter(BuilderPage);

        await user.click(screen.getAllByRole('button', { name: 'Remove experience' })[0]);
        await user.click(screen.getAllByRole('button', { name: 'Remove skill' })[1]);

        expect(valuesOf('Company')).toEqual(['Second']);
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.queryByText('B')).not.toBeInTheDocument();
        expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should write all three keys and show the saved time when Save is clicked', async () => {
        const user = userEvent.setup();
        await renderWithRouter(BuilderPage);

        await user.type(firstNameInput(), 'Ada');
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(storedResume().personalInfo.firstName).toBe('Ada');
        expect(JSON.parse(localStorage.getItem('resumeData_backup') ?? '')).toEqual(storedResume());
        expect(localStorage.getItem('resumeData_lastSaved')).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(screen.getByText(/^Saved .+/)).toBeInTheDocument();
    });

    it('should autosave once after an edit when the 30 second tick runs', async () => {
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
        const user = userEvent.setup();
        await renderWithRouter(BuilderPage);

        await user.type(firstNameInput(), 'Ada');
        act(() => vi.advanceTimersByTime(30_000));

        expect(storedResume().personalInfo.firstName).toBe('Ada');
        expect(localStorage.getItem('resumeData_backup')).toBeNull();
        expect(screen.getByText(/^Auto-saved .+/)).toBeInTheDocument();

        localStorage.removeItem('resumeData');
        act(() => vi.advanceTimersByTime(30_000));
        expect(localStorage.getItem('resumeData')).toBeNull();
    });

    it('should clear the stored resume but keep the backup when reset is confirmed', async () => {
        const user = userEvent.setup();
        storeResume(
            resume({
                personalInfo: { ...EMPTY_PERSONAL_INFO, firstName: 'Ada', email: 'a@b.co' },
                skills: [{ name: 'React' }],
            }),
        );
        await renderWithRouter(BuilderPage);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        await user.click(screen.getByRole('button', { name: 'Reset' }));
        await user.click(await screen.findByRole('button', { name: 'Reset All Data' }));

        expect(localStorage.getItem('resumeData')).toBeNull();
        expect(localStorage.getItem('resumeData_lastSaved')).toBeNull();
        expect(localStorage.getItem('resumeData_backup')).not.toBeNull();
        expect(firstNameInput()).toHaveValue('');
        expect(screen.queryByText('React')).not.toBeInTheDocument();

        // A further rerender must not bring the old resume back
        await user.type(lastNameInput(), 'X');
        expect(firstNameInput()).toHaveValue('');
        expect(emailInput()).toHaveValue('');
        expect(screen.queryByText('React')).not.toBeInTheDocument();
    });

    it('should show the too large error when the PDF is over 10MB', async () => {
        const user = userEvent.setup();
        const { container } = await renderWithRouter(BuilderPage);

        await user.upload(fileInput(container), pdfFile(10 * 1024 * 1024 + 1));

        expect(await screen.findByText('Unable to Load PDF')).toBeInTheDocument();
        expect(
            screen.getByText('The PDF file is too large. Maximum size is 10MB.'),
        ).toBeInTheDocument();
        expect(loadResumeFromPDF).not.toHaveBeenCalled();
    });

    it('should fill the form and store it when the PDF import succeeds', async () => {
        const user = userEvent.setup();
        vi.mocked(loadResumeFromPDF).mockResolvedValue(
            resume({
                templateId: 'default',
                personalInfo: { ...EMPTY_PERSONAL_INFO, firstName: 'Imported', email: 'i@x.co' },
                skills: [{ name: 'Go' }],
            }),
        );
        const { container } = await renderWithRouter(BuilderPage);

        await user.upload(fileInput(container), pdfFile());

        await waitFor(() => expect(firstNameInput()).toHaveValue('Imported'));
        expect(storedResume().personalInfo.firstName).toBe('Imported');
        expect(storedResume().templateId).toBe('default');
        expect(fileInput(container).value).toBe('');

        // A further rerender must keep the imported values
        await user.type(lastNameInput(), 'X');
        expect(firstNameInput()).toHaveValue('Imported');
        expect(emailInput()).toHaveValue('i@x.co');
        expect(screen.getByText('Go')).toBeInTheDocument();
    });

    it('should show the error message when the PDF import fails', async () => {
        const user = userEvent.setup();
        vi.mocked(loadResumeFromPDF).mockRejectedValue(new Error('Not a resume PDF'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = await renderWithRouter(BuilderPage);

        await user.upload(fileInput(container), pdfFile());

        expect(await screen.findByText('Not a resume PDF')).toBeInTheDocument();
        expect(screen.getByText('Unable to Load PDF')).toBeInTheDocument();
    });

    it('should unlock Preview when the required fields are filled', async () => {
        const user = userEvent.setup();
        await renderWithRouter(BuilderPage);
        expect(previewButton()).toBeDisabled();

        await user.type(firstNameInput(), 'Ada');
        await user.type(lastNameInput(), 'Lovelace');
        await user.type(emailInput(), 'ada@example.com');

        await waitFor(() => expect(previewButton()).toBeEnabled());
    });

    it('should store the resume and open the preview when a valid form is submitted', async () => {
        const user = userEvent.setup();
        const { router } = await renderWithRouter(BuilderPage);

        await user.type(firstNameInput(), 'Ada');
        await user.type(lastNameInput(), 'Lovelace');
        await user.type(emailInput(), 'ada@example.com');
        await waitFor(() => expect(previewButton()).toBeEnabled());
        await user.click(previewButton());

        expect(await screen.findByText('preview stub')).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/preview');
        expect(router.state.location.search).toEqual({ templateId: 'developer' });
        expect(storedResume().personalInfo.email).toBe('ada@example.com');
    });

    it('should show the save failed text when the storage write fails', async () => {
        const user = userEvent.setup();
        await renderWithRouter(BuilderPage);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(screen.getByText('Save failed — storage may be full')).toBeInTheDocument();
    });
});
