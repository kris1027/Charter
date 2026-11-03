import { Button } from '@/components/ui/button';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { ListEmptyState } from '@/features/builder/form-sections/list-empty-state';
import { SortableCard } from '@/features/builder/form-sections/sortable-item';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { EMPTY_EDUCATION } from '@/features/resume/stored-resume';
import { Plus, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EducationItem = withForm({
    ...resumeFormOptions,
    props: { id: '', index: 0, onRemove: () => {} },
    render: function Render({ form, id, index, onRemove }) {
        const { t } = useTranslation();

        return (
            <SortableCard
                id={id}
                title={t('sections.education.item', { number: index + 1 })}
                removeLabel={t('accessibility.removeEducation')}
                onRemove={onRemove}
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
                        {/* Array mode rerenders only on its helpers; this also catches form.reset */}
                        <form.Subscribe selector={(state) => state.values.education}>
                            {(items) => (
                                <div className='space-y-6'>
                                    {items.length === 0 && (
                                        <ListEmptyState
                                            icon={GraduationCap}
                                            iconGradient='from-violet-500 to-purple-600'
                                            title={t('sections.education.empty')}
                                            hint={t('sections.education.emptyHint')}
                                        />
                                    )}
                                    {items.length > 0 && (
                                        <SortableList
                                            items={items}
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
                            )}
                        </form.Subscribe>
                    </FormSectionCard>
                )}
            </form.Field>
        );
    },
});
