import { Button } from '@/components/ui/button';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { DragHandle } from '@/features/builder/form-sections/sortable-item';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { useSortableItem } from '@/features/builder/form-sections/use-sortable-item';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { EMPTY_EDUCATION } from '@/features/resume/stored-resume';
import { Trash2, Plus, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EducationItem = withForm({
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
                            {t('sections.education.item', { number: index + 1 })}
                        </h4>
                    </div>
                    <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={onRemove}
                        className='text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                        aria-label={t('accessibility.removeEducation')}
                    >
                        <Trash2 className='h-4 w-4' />
                    </Button>
                </div>

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
            </div>
        );
    },
});

export const EducationSection = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();

        return (
            <form.Field name='education' mode='array'>
                {(field) => (
                    <FormSectionCard
                        icon={GraduationCap}
                        iconGradient='from-violet-500 to-purple-600'
                        title={t('sections.education.title')}
                        description={t('sections.education.description')}
                        headerAction={
                            <Button
                                type='button'
                                onClick={() => field.pushValue({ ...EMPTY_EDUCATION })}
                                className='bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg'
                            >
                                <Plus className='mr-2 h-4 w-4' />
                                {t('sections.education.add')}
                            </Button>
                        }
                    >
                        <div className='space-y-6'>
                            {field.state.value.length === 0 && (
                                <div className='py-8 text-center'>
                                    <div className='mx-auto mb-3 inline-flex rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-2.5 text-white/60 shadow-inner'>
                                        <GraduationCap className='h-6 w-6' />
                                    </div>
                                    <p className='font-display font-medium text-slate-500 dark:text-slate-400'>
                                        {t('sections.education.empty')}
                                    </p>
                                    <p className='mt-1 text-sm text-slate-400 dark:text-slate-500'>
                                        {t('sections.education.emptyHint')}
                                    </p>
                                </div>
                            )}
                            {field.state.value.length > 0 && (
                                <SortableList
                                    items={field.state.value}
                                    idPrefix='education'
                                    strategy='vertical'
                                    onMove={field.moveValue}
                                    className='space-y-6'
                                >
                                    {(_, index, id) => (
                                        <EducationItem
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
                    </FormSectionCard>
                )}
            </form.Field>
        );
    },
});
