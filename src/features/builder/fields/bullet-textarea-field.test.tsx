import { describe, expect, it } from 'vitest';

import { resumeFormOptions, useAppForm } from '@/features/builder/resume-form';
import { EMPTY_EXPERIENCE, EMPTY_RESUME } from '@/features/resume/stored-resume';
import { render, screen, userEvent, waitFor } from '@/test/test-utils';

const Harness = ({ description = '' }: { description?: string }) => {
    const form = useAppForm({
        ...resumeFormOptions,
        defaultValues: {
            ...EMPTY_RESUME,
            experiences: [{ ...EMPTY_EXPERIENCE, description }],
        },
    });
    return (
        <form.AppField name='experiences[0].description'>
            {(field) => <field.BulletTextareaField label='Description' hint='One per line' />}
        </form.AppField>
    );
};

const textarea = () => screen.getByLabelText<HTMLTextAreaElement>('Description');

describe('BulletTextareaField', () => {
    it('should put a bullet before the first typed character when the field is empty', async () => {
        const user = userEvent.setup();
        render(<Harness />);

        await user.type(textarea(), 'Led');

        expect(textarea()).toHaveValue('• Led');
        expect(textarea()).toHaveAttribute('name', 'experiences[0].description');
        expect(screen.getByText('One per line')).toBeInTheDocument();
    });

    it('should add a bullet to pasted text when the field is empty', async () => {
        const user = userEvent.setup();
        render(<Harness />);

        await user.click(textarea());
        await user.paste('  Shipped it');

        expect(textarea()).toHaveValue('• Shipped it');
    });

    it('should keep pasted text as is when it already starts with a bullet', async () => {
        const user = userEvent.setup();
        render(<Harness />);

        await user.click(textarea());
        await user.paste('• Already');

        expect(textarea()).toHaveValue('• Already');
    });

    it('should insert a new bullet line and place the caret after it when Enter is pressed', async () => {
        const user = userEvent.setup();
        render(<Harness description='• One' />);

        await user.click(textarea());
        textarea().setSelectionRange(5, 5);
        await user.keyboard('{Enter}');

        expect(textarea()).toHaveValue('• One\n• ');
        await waitFor(() => expect(textarea().selectionStart).toBe(8));
    });
});
