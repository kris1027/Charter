import { Button } from '@/components/ui/button';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { ListEmptyState } from '@/features/builder/form-sections/list-empty-state';
import { SortableCard } from '@/features/builder/form-sections/sortable-item';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { getLanguageLevels } from '@/features/resume/language-levels';
import { EMPTY_LANGUAGE } from '@/features/resume/stored-resume';
import { Plus, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LanguageItem = withForm({
    ...resumeFormOptions,
    props: { id: '', index: 0, onRemove: () => {} },
    render: function Render({ form, id, index, onRemove }) {
        const { t } = useTranslation();

        return (
            <SortableCard
                id={id}
                title={t('sections.languages.item', { number: index + 1 })}
                removeLabel={t('accessibility.removeLanguage')}
                onRemove={onRemove}
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
                        {/* Only the length: a card reads its own fields, so typing redraws one field. Array
                            mode rerenders only on its helpers; this also catches form.reset */}
                        <form.Subscribe selector={(state) => state.values.languages.length}>
                            {(count) => (
                                <div className='space-y-4'>
                                    {count === 0 && (
                                        <ListEmptyState
                                            icon={Globe}
                                            iconGradient='from-cyan-500 to-blue-600'
                                            title={t('sections.languages.empty')}
                                            hint={t('sections.languages.emptyHint')}
                                        />
                                    )}
                                    {count > 0 && (
                                        <SortableList
                                            count={count}
                                            idPrefix='language'
                                            strategy='vertical'
                                            onMove={field.moveValue}
                                            className='space-y-4'
                                        >
                                            {(index, id) => (
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
                            )}
                        </form.Subscribe>
                    </FormSectionCard>
                )}
            </form.Field>
        );
    },
});
