import { ChipListSection } from '@/features/builder/form-sections/chip-list-section';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const InterestsSection = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();

        return (
            <form.Field name='interests' mode='array'>
                {(field) => (
                    // Array mode rerenders only on its helpers; this also catches form.reset
                    <form.Subscribe selector={(state) => state.values.interests}>
                        {(items) => (
                            <ChipListSection
                                sectionId='interests'
                                icon={Heart}
                                idPrefix='interest'
                                inputLabel={t('placeholders.interest')}
                                removeLabel={t('accessibility.removeInterest')}
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
