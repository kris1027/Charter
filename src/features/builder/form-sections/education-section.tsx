import { CardListSection } from '@/features/builder/form-sections/card-list-section';
import { focusField } from '@/features/builder/form-sections/focus-field';
import { NO_MOVE_CONTROLS } from '@/features/builder/form-sections/sortable-ids';
import { SortableCard } from '@/features/builder/form-sections/sortable-item';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { EMPTY_EDUCATION } from '@/features/resume/stored-resume';
import { GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EducationItem = withForm({
    ...resumeFormOptions,
    props: { id: '', index: 0, onRemove: () => {}, controls: NO_MOVE_CONTROLS },
    render: function Render({ form, id, index, onRemove, controls }) {
        const { t } = useTranslation();

        return (
            <SortableCard
                id={id}
                title={t('sections.education.item', { number: index + 1 })}
                removeLabel={t('accessibility.removeEducation')}
                onRemove={onRemove}
                controls={controls}
                className='space-y-4'
            >
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <form.AppField name={`education[${index}].institution`}>
                        {(field) => (
                            <field.TextField
                                label={t('form.institution')}
                                placeholder={t('placeholders.institution')}
                            />
                        )}
                    </form.AppField>
                    <form.AppField name={`education[${index}].degree`}>
                        {(field) => (
                            <field.TextField
                                label={t('form.degree')}
                                placeholder={t('placeholders.degree')}
                            />
                        )}
                    </form.AppField>
                    <form.AppField name={`education[${index}].field`}>
                        {(field) => (
                            <field.TextField
                                label={t('form.field')}
                                placeholder={t('placeholders.field')}
                            />
                        )}
                    </form.AppField>

                    <div className='grid grid-cols-2 gap-2'>
                        <form.AppField name={`education[${index}].startDate`}>
                            {(field) => (
                                <field.DateField
                                    label={t('form.startDate')}
                                    yearOnly
                                    placeholder='Select year'
                                />
                            )}
                        </form.AppField>
                        <form.AppField name={`education[${index}].endDate`}>
                            {(field) => (
                                <field.DateField
                                    label={t('form.endDate')}
                                    yearOnly
                                    placeholder='Select year'
                                />
                            )}
                        </form.AppField>
                    </div>
                </div>

                <form.AppField name={`education[${index}].description`}>
                    {(field) => (
                        <field.TextareaField
                            label={t('form.description')}
                            placeholder='GPA, relevant coursework, achievements...'
                            className='min-h-[100px] resize-none'
                        />
                    )}
                </form.AppField>
            </SortableCard>
        );
    },
});

export const EducationSection = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        return (
            <form.Field name='education' mode='array'>
                {(field) => (
                    // Only the length: a card reads its own fields, so typing redraws one field.
                    // Array mode rerenders only on its helpers; this also catches form.reset
                    <form.Subscribe selector={(state) => state.values.education.length}>
                        {(count) => (
                            <CardListSection
                                sectionId='education'
                                copyKey='education'
                                icon={GraduationCap}
                                idPrefix='education'
                                count={count}
                                onAdd={() => {
                                    // Goes last, and focus moves into it (spec 0012, AC-27)
                                    field.pushValue({ ...EMPTY_EDUCATION });
                                    focusField(`education[${count}].institution`);
                                }}
                                onMove={field.moveValue}
                                onRemove={field.removeValue}
                            >
                                {(index, id, controls, onRemove) => (
                                    <EducationItem
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
