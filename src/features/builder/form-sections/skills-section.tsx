import { ChipListSection } from '@/features/builder/form-sections/chip-list-section';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const SkillsSection = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();

        return (
            <form.Field name='skills' mode='array'>
                {(field) => (
                    // Array mode rerenders only on its helpers; this also catches form.reset
                    <form.Subscribe selector={(state) => state.values.skills}>
                        {(items) => (
                            <ChipListSection
                                sectionId='skills'
                                icon={Code}
                                idPrefix='skill'
                                inputLabel={t('placeholders.skill')}
                                removeLabel={t('accessibility.removeSkill')}
                                names={items.map((item) => item.name)}
                                onAdd={(name) => field.pushValue({ name })}
                                onMove={field.moveValue}
                                onRemove={field.removeValue}
                            />
                        )}
                    </form.Subscribe>
                )}
            </form.Field>
        );
    },
});
