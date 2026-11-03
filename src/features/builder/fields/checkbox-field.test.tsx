import { describe, expect, it } from 'vitest';

import { resumeFormOptions, useAppForm } from '@/features/builder/resume-form';
import { EMPTY_EXPERIENCE, EMPTY_RESUME } from '@/features/resume/stored-resume';
import { render, screen, userEvent } from '@/test/test-utils';

const Harness = () => {
    const form = useAppForm({
        ...resumeFormOptions,
        defaultValues: { ...EMPTY_RESUME, experiences: [{ ...EMPTY_EXPERIENCE }] },
    });
    return (
        <form.AppField name='experiences[0].current'>
            {(field) => <field.CheckboxField label='Currently working here' />}
        </form.AppField>
    );
};

describe('CheckboxField', () => {
    it('should toggle the value when its label is clicked', async () => {
        const user = userEvent.setup();
        render(<Harness />);
        const checkbox = screen.getByRole('checkbox', { name: 'Currently working here' });
        expect(checkbox).not.toBeChecked();

        await user.click(screen.getByText('Currently working here'));

        expect(checkbox).toBeChecked();
        expect(checkbox).toHaveAttribute('id', 'experiences[0].current');
    });
});
