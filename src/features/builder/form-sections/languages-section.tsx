import { Button } from '@/components/ui/button';
import { focusField } from '@/features/builder/form-sections/focus-field';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { ListEmptyState } from '@/features/builder/form-sections/list-empty-state';
import { NO_MOVE_CONTROLS } from '@/features/builder/form-sections/sortable-ids';
import { SortableCard } from '@/features/builder/form-sections/sortable-item';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { useListAnnouncer } from '@/features/builder/form-sections/use-list-announcer';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { getLanguageLevels } from '@/features/resume/language-levels';
import { EMPTY_LANGUAGE } from '@/features/resume/stored-resume';
import { Plus, Globe } from 'lucide-react';
import { useRef } from 'react';
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
        const { t } = useTranslation();
        const addButtonRef = useRef<HTMLButtonElement>(null);
        const announcer = useListAnnouncer();
        const itemTitle = (index: number) => t('sections.languages.item', { number: index + 1 });

        return (
            <form.Field name='languages' mode='array'>
                {(field) => {
                    // New language goes last, and focus moves into it (spec 0012, AC-27)
                    const handleAdd = () => {
                        const index = field.state.value.length;
                        field.pushValue({ ...EMPTY_LANGUAGE });
                        focusField(`languages[${index}].language`);
                    };

                    // Focus goes to Add, which stays mounted when the list empties (AC-28)
                    const handleRemove = (index: number) => {
                        field.removeValue(index);
                        announcer.announce(
                            t('builder.reorder.removed', { item: itemTitle(index) }),
                        );
                        addButtonRef.current?.focus();
                    };

                    return (
                        <FormSectionCard
                            sectionId='languages'
                            icon={Globe}
                            title={t('sections.languages.title')}
                            description={t('sections.languages.description')}
                            headerAction={
                                <Button
                                    ref={addButtonRef}
                                    type='button'
                                    variant='outline'
                                    onClick={handleAdd}
                                >
                                    <Plus aria-hidden='true' />
                                    {t('sections.languages.add')}
                                </Button>
                            }
                        >
                            {/* Only the length: a card reads its own fields, so typing redraws one
                                field. Array mode rerenders only on its helpers; this also catches
                                form.reset */}
                            <form.Subscribe selector={(state) => state.values.languages.length}>
                                {(count) => (
                                    <div className='space-y-4'>
                                        {count === 0 && (
                                            <ListEmptyState
                                                icon={Globe}
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
                                                onAnnounce={announcer.announce}
                                                className='space-y-4'
                                            >
                                                {(index, id, controls) => (
                                                    <LanguageItem
                                                        key={id}
                                                        form={form}
                                                        id={id}
                                                        index={index}
                                                        controls={controls}
                                                        onRemove={() => handleRemove(index)}
                                                    />
                                                )}
                                            </SortableList>
                                        )}
                                    </div>
                                )}
                            </form.Subscribe>
                            <div role='status' className='sr-only'>
                                {announcer.message}
                            </div>
                        </FormSectionCard>
                    );
                }}
            </form.Field>
        );
    },
});
