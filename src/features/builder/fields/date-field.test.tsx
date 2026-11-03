import { describe, expect, it } from 'vitest';

import { resumeFormOptions, useAppForm } from '@/features/builder/resume-form';
import { EMPTY_EXPERIENCE, EMPTY_RESUME } from '@/features/resume/stored-resume';
import { render, screen } from '@/test/test-utils';

const Harness = ({ disabled }: { disabled?: boolean }) => {
    const form = useAppForm({
        ...resumeFormOptions,
        defaultValues: { ...EMPTY_RESUME, experiences: [{ ...EMPTY_EXPERIENCE }] },
    });
    return (
        <form.AppField name='experiences[0].endDate'>
            {(field) => <field.DateField label='End Date' disabled={disabled} />}
        </form.AppField>
    );
};

describe('DateField', () => {
    it('should link the label to the date picker when rendered', () => {
        render(<Harness />);

        expect(screen.getByLabelText('End Date')).toHaveAttribute('id', 'experiences[0].endDate');
    });

    it('should disable the picker when disabled is set', () => {
        render(<Harness disabled />);

        expect(screen.getByLabelText('End Date')).toBeDisabled();
    });
});
