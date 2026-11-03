import { Button } from '@/components/ui/button';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { DragHandle } from '@/features/builder/form-sections/sortable-item';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { useSortableItem } from '@/features/builder/form-sections/use-sortable-item';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { getLanguageLevels } from '@/features/resume/language-levels';
import { EMPTY_LANGUAGE } from '@/features/resume/stored-resume';
import { Trash2, Plus, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LanguageItem = withForm({
    ...resumeFormOptions,
    props: { id: '', index: 0, onRemove: () => {} },
    render: function Render({ form, id, index, onRemove }) {
        const { t } = useTranslation();
        const { setNodeRef, style, isDragging, handleProps } = useSortableItem(id);

        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`rounded-xl border border-slate-200/60 bg-white/40 p-6 backdrop-blur-sm transition-all hover:shadow-md dark:border-white/5 dark:bg-white/[0.02] dark:hover:shadow-indigo-500/5 ${isDragging ? 'shadow-lg ring-2 ring-indigo-500/20' : ''}`}
            >
                <div className='mb-4 flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <DragHandle handleProps={handleProps} size='md' />
                        <h4 className='font-display text-lg font-semibold text-slate-700 dark:text-slate-300'>
                            {t('sections.languages.item', { number: index + 1 })}
                        </h4>
                    </div>
                    <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={onRemove}
                        className='text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                        aria-label={t('accessibility.removeLanguage')}
                    >
                        <Trash2 className='h-4 w-4' />
                    </Button>
                </div>

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
            </div>
        );
    },
});

export const LanguagesSection = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();

        return (
            <form.Field name='languages' mode='array'>
                {(field) => (
                    <FormSectionCard
                        icon={Globe}
                        iconGradient='from-cyan-500 to-blue-600'
                        title={t('sections.languages.title')}
                        description={t('sections.languages.description')}
                        headerAction={
                            <Button
                                type='button'
                                onClick={() => field.pushValue({ ...EMPTY_LANGUAGE })}
                                className='bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg'
                            >
                                <Plus className='mr-2 h-4 w-4' />
                                {t('sections.languages.add')}
                            </Button>
                        }
                    >
                        <div className='space-y-4'>
                            {field.state.value.length === 0 && (
                                <div className='py-8 text-center'>
                                    <div className='mx-auto mb-3 inline-flex rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-2.5 text-white/60 shadow-inner'>
                                        <Globe className='h-6 w-6' />
                                    </div>
                                    <p className='font-display font-medium text-slate-500 dark:text-slate-400'>
                                        {t('sections.languages.empty')}
                                    </p>
                                    <p className='mt-1 text-sm text-slate-400 dark:text-slate-500'>
                                        {t('sections.languages.emptyHint')}
                                    </p>
                                </div>
                            )}
                            {field.state.value.length > 0 && (
                                <SortableList
                                    items={field.state.value}
                                    idPrefix='language'
                                    strategy='vertical'
                                    onMove={field.moveValue}
                                    className='space-y-4'
                                >
                                    {(_, index, id) => (
                                        <LanguageItem
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
