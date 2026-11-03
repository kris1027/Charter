import { describe, expect, it } from 'vitest';

import { resumeFormOptions, useAppForm } from '@/features/builder/resume-form';
import { render, screen, userEvent, waitFor } from '@/test/test-utils';

const EmailHarness = () => {
    const form = useAppForm({ ...resumeFormOptions });
    return (
        <form.AppField name='personalInfo.email'>
            {(field) => <field.TextField label='Email' type='email' required />}
        </form.AppField>
    );
};

const TitleHarness = () => {
    const form = useAppForm({ ...resumeFormOptions });
    return (
        <form.AppField name='personalInfo.title'>
            {(field) => <field.TextField label='Title' placeholder='Your title' />}
        </form.AppField>
    );
};

describe('TextField', () => {
    it('should link the label to an input named by the field path when rendered', () => {
        render(<EmailHarness />);

        const input = screen.getByLabelText(/^Email/);
        expect(input).toHaveAttribute('id', 'personalInfo.email');
        expect(input).toHaveAttribute('name', 'personalInfo.email');
        expect(input).toHaveAttribute('type', 'email');
        expect(screen.getByText('*')).toHaveClass('text-red-500');
    });

    it('should show no error when the empty required field is untouched', () => {
        render(<EmailHarness />);

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByLabelText(/^Email/)).not.toHaveClass('border-red-500');
    });

    it('should show the error and red border when the invalid field is touched', async () => {
        const user = userEvent.setup();
        render(<EmailHarness />);
        const input = screen.getByLabelText(/^Email/);

        await user.type(input, 'x');
        await user.tab();

        await waitFor(() =>
            expect(screen.getByRole('alert')).toHaveTextContent(
                'Please enter a valid email address',
            ),
        );
        expect(input).toHaveClass('border-red-500');
    });

    it('should keep the plain label and no star when the field is optional', async () => {
        const user = userEvent.setup();
        render(<TitleHarness />);
        const input = screen.getByLabelText('Title');

        await user.type(input, 'Engineer');

        expect(input).toHaveValue('Engineer');
        expect(input).toHaveAttribute('placeholder', 'Your title');
        expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
});
