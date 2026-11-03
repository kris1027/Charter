import { Button } from '@/components/ui/button';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { ListEmptyState } from '@/features/builder/form-sections/list-empty-state';
import { SortableCard } from '@/features/builder/form-sections/sortable-item';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { EMPTY_EXPERIENCE } from '@/features/resume/stored-resume';
import { Plus, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ExperienceItem = withForm({
    ...resumeFormOptions,
    props: { id: '', index: 0, onRemove: () => {} },
    render: function Render({ form, id, index, onRemove }) {
        const { t } = useTranslation();

        return (
            <SortableCard
                id={id}
                title={t('sections.experience.item', { number: index + 1 })}
                removeLabel={t('accessibility.removeExperience')}
                onRemove={onRemove}
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
        const { t } = useTranslation();

        return (
            <form.Field name='experiences' mode='array'>
                {(field) => (
                    <FormSectionCard
                        icon={Briefcase}
                        iconGradient='from-emerald-500 to-teal-600'
                        title={t('sections.experience.title')}
                        description={t('sections.experience.description')}
                        headerAction={
                            <Button
                                type='button'
                                // New experience goes first
                                onClick={() => field.insertValue(0, { ...EMPTY_EXPERIENCE })}
                                className='bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg'
                            >
                                <Plus className='mr-2 h-4 w-4' />
                                {t('sections.experience.add')}
                            </Button>
                        }
                    >
                        {/* Array mode rerenders only on its helpers; this also catches form.reset */}
                        <form.Subscribe selector={(state) => state.values.experiences}>
                            {(items) => (
                                <div className='space-y-6'>
                                    {items.length === 0 && (
                                        <ListEmptyState
                                            icon={Briefcase}
                                            iconGradient='from-emerald-500 to-teal-600'
                                            title={t('sections.experience.empty')}
                                            hint={t('sections.experience.emptyHint')}
                                        />
                                    )}
                                    {items.length > 0 && (
                                        <SortableList
                                            items={items}
                                            idPrefix='experience'
                                            strategy='vertical'
                                            onMove={field.moveValue}
                                            className='space-y-6'
                                        >
                                            {(_, index, id) => (
                                                <ExperienceItem
                                                    key={id}
                                                    form={form}
                                                    id={id}
                                                    index={index}
                                                    onRemove={() => field.removeValue(index)}
                                                />
                                            )}
                                        </SortableList>
                                    )}
                                </div>
                            )}
                        </form.Subscribe>
                    </FormSectionCard>
                )}
            </form.Field>
        );
    },
});
