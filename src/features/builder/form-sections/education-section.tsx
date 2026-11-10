import { Button } from '@/components/ui/button';
import { focusField } from '@/features/builder/form-sections/focus-field';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { ListEmptyState } from '@/features/builder/form-sections/list-empty-state';
import { NO_MOVE_CONTROLS } from '@/features/builder/form-sections/sortable-ids';
import { SortableCard } from '@/features/builder/form-sections/sortable-item';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { useListAnnouncer } from '@/features/builder/form-sections/use-list-announcer';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { EMPTY_EDUCATION } from '@/features/resume/stored-resume';
import { Plus, GraduationCap } from 'lucide-react';
import { useRef } from 'react';
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
        const { t } = useTranslation();
        const addButtonRef = useRef<HTMLButtonElement>(null);
        const announcer = useListAnnouncer();
        const itemTitle = (index: number) => t('sections.education.item', { number: index + 1 });

        return (
            <form.Field name='education' mode='array'>
                {(field) => {
                    // New education goes last, and focus moves into it (spec 0012, AC-27)
                    const handleAdd = () => {
                        const index = field.state.value.length;
                        field.pushValue({ ...EMPTY_EDUCATION });
                        focusField(`education[${index}].institution`);
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
                            sectionId='education'
                            icon={GraduationCap}
                            title={t('sections.education.title')}
                            description={t('sections.education.description')}
                            headerAction={
                                <Button
                                    ref={addButtonRef}
                                    type='button'
                                    variant='outline'
                                    onClick={handleAdd}
                                >
                                    <Plus aria-hidden='true' />
                                    {t('sections.education.add')}
                                </Button>
                            }
                        >
                            {/* Only the length: a card reads its own fields, so typing redraws one
                                field. Array mode rerenders only on its helpers; this also catches
                                form.reset */}
                            <form.Subscribe selector={(state) => state.values.education.length}>
                                {(count) => (
                                    <div className='space-y-4'>
                                        {count === 0 && (
                                            <ListEmptyState
                                                icon={GraduationCap}
                                                title={t('sections.education.empty')}
                                                hint={t('sections.education.emptyHint')}
                                            />
                                        )}
                                        {count > 0 && (
                                            <SortableList
                                                count={count}
                                                idPrefix='education'
                                                strategy='vertical'
                                                onMove={field.moveValue}
                                                onAnnounce={announcer.announce}
                                                className='space-y-4'
                                            >
                                                {(index, id, controls) => (
                                                    <EducationItem
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
