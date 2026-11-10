import { CardListSection } from '@/features/builder/form-sections/card-list-section';
import { focusField } from '@/features/builder/form-sections/focus-field';
import { NO_MOVE_CONTROLS } from '@/features/builder/form-sections/sortable-ids';
import { SortableCard } from '@/features/builder/form-sections/sortable-item';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { EMPTY_EXPERIENCE } from '@/features/resume/stored-resume';
import { Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ExperienceItem = withForm({
    ...resumeFormOptions,
    props: { id: '', index: 0, onRemove: () => {}, controls: NO_MOVE_CONTROLS },
    render: function Render({ form, id, index, onRemove, controls }) {
        const { t } = useTranslation();

        return (
            <SortableCard
                id={id}
                title={t('sections.experience.item', { number: index + 1 })}
                removeLabel={t('accessibility.removeExperience')}
                onRemove={onRemove}
                controls={controls}
                className='space-y-4'
            >
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <form.AppField name={`experiences[${index}].company`}>
                        {(field) => (
                            <field.TextField
                                label={t('form.company')}
                                placeholder={t('placeholders.company')}
                            />
                        )}
                    </form.AppField>
                    <form.AppField name={`experiences[${index}].position`}>
                        {(field) => (
                            <field.TextField
                                label={t('form.position')}
                                placeholder={t('placeholders.position')}
                            />
                        )}
                    </form.AppField>
                    <form.AppField name={`experiences[${index}].location`}>
                        {(field) => (
                            <field.TextField
                                label={t('form.location')}
                                placeholder={t('placeholders.locationJob')}
                            />
                        )}
                    </form.AppField>
                    <form.AppField name={`experiences[${index}].startDate`}>
                        {(field) => <field.DateField label={t('form.startDate')} />}
                    </form.AppField>
                    <form.Subscribe selector={(state) => state.values.experiences[index]?.current}>
                        {(current) => (
                            <form.AppField name={`experiences[${index}].endDate`}>
                                {(field) => (
                                    <field.DateField label={t('form.endDate')} disabled={current} />
                                )}
                            </form.AppField>
                        )}
                    </form.Subscribe>
                </div>

                <form.AppField name={`experiences[${index}].current`}>
                    {(field) => <field.CheckboxField label={t('form.currentlyWorking')} />}
                </form.AppField>

                <form.AppField name={`experiences[${index}].description`}>
                    {(field) => (
                        <field.BulletTextareaField
                            label={t('form.description')}
                            placeholder={t('placeholders.description')}
                            hint={t('sections.experience.bulletHint')}
                        />
                    )}
                </form.AppField>
            </SortableCard>
        );
    },
});

export const ExperienceSection = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        return (
            <form.Field name='experiences' mode='array'>
                {(field) => (
                    // Only the length: a card reads its own fields, so typing redraws one field.
                    // Array mode rerenders only on its helpers; this also catches form.reset
                    <form.Subscribe selector={(state) => state.values.experiences.length}>
                        {(count) => (
                            <CardListSection
                                sectionId='experiences'
                                copyKey='experience'
                                icon={Briefcase}
                                idPrefix='experience'
                                count={count}
                                onAdd={() => {
                                    // Goes first, and focus moves into it (spec 0012, AC-27)
                                    field.insertValue(0, { ...EMPTY_EXPERIENCE });
                                    focusField('experiences[0].company');
                                }}
                                onMove={field.moveValue}
                                onRemove={field.removeValue}
                            >
                                {(index, id, controls, onRemove) => (
                                    <ExperienceItem
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
