import { describe, expect, it } from 'vitest';

import { resumeFormOptions, useAppForm } from '@/features/builder/resume-form';
import { EMPTY_LANGUAGE, EMPTY_RESUME } from '@/features/resume/stored-resume';
import { render, screen, userEvent } from '@/test/test-utils';

const options = [
    { value: 'A1', label: 'Beginner' },
    { value: 'C2', label: 'Proficient' },
];

const Harness = () => {
    const form = useAppForm({
        ...resumeFormOptions,
        defaultValues: { ...EMPTY_RESUME, languages: [{ ...EMPTY_LANGUAGE }] },
    });
    return (
        <>
            <form.AppField name='languages[0].proficiency'>
                {(field) => <field.SelectField label='Proficiency' options={options} />}
            </form.AppField>
            <form.Subscribe selector={(state) => state.values.languages[0].proficiency}>
                {(proficiency) => <output>{proficiency}</output>}
            </form.Subscribe>
        </>
    );
};

describe('SelectField', () => {
    it('should show the current option and store the picked one when an option is chosen', async () => {
        const user = userEvent.setup();
        render(<Harness />);
        const trigger = screen.getByRole('combobox', { name: 'Proficiency' });
        expect(trigger).toHaveTextContent('Beginner');

        await user.click(trigger);
        await user.click(await screen.findByRole('option', { name: 'Proficient' }));

        expect(screen.getByRole('status')).toHaveTextContent('C2');
    });
});
