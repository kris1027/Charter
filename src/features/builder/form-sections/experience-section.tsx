import { Button } from '@/components/ui/button';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { DragHandle } from '@/features/builder/form-sections/sortable-item';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { useSortableItem } from '@/features/builder/form-sections/use-sortable-item';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { EMPTY_EXPERIENCE } from '@/features/resume/stored-resume';
import { Trash2, Plus, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ExperienceItem = withForm({
    ...resumeFormOptions,
    props: { id: '', index: 0, onRemove: () => {} },
    render: function Render({ form, id, index, onRemove }) {
        const { t } = useTranslation();
        const { setNodeRef, style, isDragging, handleProps } = useSortableItem(id);

        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`space-y-4 rounded-xl border border-slate-200/60 bg-white/40 p-6 backdrop-blur-sm transition-all hover:shadow-md dark:border-white/5 dark:bg-white/[0.02] dark:hover:shadow-indigo-500/5 ${isDragging ? 'shadow-lg ring-2 ring-indigo-500/20' : ''}`}
            >
                <div className='mb-4 flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <DragHandle handleProps={handleProps} size='md' />
                        <h4 className='font-display text-lg font-semibold text-slate-700 dark:text-slate-300'>
                            {t('sections.experience.item', { number: index + 1 })}
                        </h4>
                    </div>
                    <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={onRemove}
                        className='text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                        aria-label={t('accessibility.removeExperience')}
                    >
                        <Trash2 className='h-4 w-4' />
                    </Button>
                </div>

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
            </div>
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
                                        <div className='py-8 text-center'>
                                            <div className='mx-auto mb-3 inline-flex rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 text-white/60 shadow-inner'>
                                                <Briefcase className='h-6 w-6' />
                                            </div>
                                            <p className='font-display font-medium text-slate-500 dark:text-slate-400'>
                                                {t('sections.experience.empty')}
                                            </p>
                                            <p className='mt-1 text-sm text-slate-400 dark:text-slate-500'>
                                                {t('sections.experience.emptyHint')}
                                            </p>
                                        </div>
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
