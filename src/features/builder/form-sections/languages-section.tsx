import { CardListSection } from '@/features/builder/form-sections/card-list-section';
import { focusField } from '@/features/builder/form-sections/focus-field';
import { NO_MOVE_CONTROLS } from '@/features/builder/form-sections/sortable-ids';
import { SortableCard } from '@/features/builder/form-sections/sortable-item';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { getLanguageLevels } from '@/features/resume/language-levels';
import { EMPTY_LANGUAGE } from '@/features/resume/stored-resume';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LanguageItem = withForm({
    ...resumeFormOptions,
    props: { id: '', index: 0, onRemove: () => {}, controls: NO_MOVE_CONTROLS },
    render: function Render({ form, id, index, onRemove, controls }) {
        const { t } = useTranslation();

        return (
            <SortableCard
                id={id}
                title={t('sections.languages.item', { number: index + 1 })}
                removeLabel={t('accessibility.removeLanguage')}
                onRemove={onRemove}
                controls={controls}
            >
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <form.AppField name={`languages[${index}].language`}>
                        {(field) => (
                            <field.TextField
                                label={t('form.language')}
                                placeholder={t('placeholders.language')}
                            />
                        )}
                    </form.AppField>
                    <form.AppField name={`languages[${index}].proficiency`}>
                        {(field) => (
                            <field.SelectField
                                label={t('form.proficiency')}
                                options={getLanguageLevels(t)}
                                placeholder={t('placeholders.selectProficiency')}
                            />
                        )}
                    </form.AppField>
                </div>
            </SortableCard>
        );
    },
});

export const LanguagesSection = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        return (
            <form.Field name='languages' mode='array'>
                {(field) => (
                    // Only the length: a card reads its own fields, so typing redraws one field.
                    // Array mode rerenders only on its helpers; this also catches form.reset
                    <form.Subscribe selector={(state) => state.values.languages.length}>
                        {(count) => (
                            <CardListSection
                                sectionId='languages'
                                copyKey='languages'
                                icon={Globe}
                                idPrefix='language'
                                count={count}
                                onAdd={() => {
                                    // Goes last, and focus moves into it (spec 0012, AC-27)
                                    field.pushValue({ ...EMPTY_LANGUAGE });
                                    focusField(`languages[${count}].language`);
                                }}
                                onMove={field.moveValue}
                                onRemove={field.removeValue}
                            >
                                {(index, id, controls, onRemove) => (
                                    <LanguageItem
                                        key={id}
                                        form={form}
                                        id={id}
                                        index={index}
                                        controls={controls}
                                        onRemove={onRemove}
                                    />
                                )}
                            </CardListSection>
                        )}
                    </form.Subscribe>
                )}
            </form.Field>
        );
    },
});
