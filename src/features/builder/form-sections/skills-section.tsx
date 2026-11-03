import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { ListEmptyState } from '@/features/builder/form-sections/list-empty-state';
import { SortableChip } from '@/features/builder/form-sections/sortable-item';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { Plus, Code } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const SkillsSection = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();
        const [skillInput, setSkillInput] = useState('');

        return (
            <FormSectionCard
                icon={Code}
                iconGradient='from-amber-500 to-orange-600'
                title={t('sections.skills.title')}
                description={t('sections.skills.description')}
            >
                <form.Field name='skills' mode='array'>
                    {(field) => {
                        const handleAdd = () => {
                            const name = skillInput.trim();
                            if (!name) return;
                            field.pushValue({ name });
                            setSkillInput('');
                        };

                        return (
                            <div className='space-y-4'>
                                <div className='flex gap-2'>
                                    <Input
                                        placeholder={t('placeholders.skill')}
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                // Keep Enter from submitting the form
                                                e.preventDefault();
                                                handleAdd();
                                            }
                                        }}
                                    />
                                    <Button
                                        type='button'
                                        onClick={handleAdd}
                                        disabled={!skillInput.trim()}
                                        className='bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700'
                                    >
                                        <Plus className='mr-2 h-4 w-4' />
                                        {t('sections.skills.add')}
                                    </Button>
                                </div>

                                {/* Array mode rerenders only on its helpers; this also catches form.reset */}
                                <form.Subscribe selector={(state) => state.values.skills}>
                                    {(items) => (
                                        <div>
                                            {items.length === 0 ? (
                                                <ListEmptyState
                                                    icon={Code}
                                                    iconGradient='from-amber-500 to-orange-600'
                                                    title={t('sections.skills.empty')}
                                                    hint={t('sections.skills.emptyHint')}
                                                />
                                            ) : (
                                                <SortableList
                                                    items={items}
                                                    idPrefix='skill'
                                                    strategy='horizontal'
                                                    onMove={field.moveValue}
                                                    className='flex flex-wrap gap-2'
                                                >
                                                    {(item, index, id) => (
                                                        <SortableChip
                                                            key={id}
                                                            id={id}
                                                            name={item.name}
                                                            removeLabel={t(
                                                                'accessibility.removeSkill',
                                                            )}
                                                            onRemove={() =>
                                                                field.removeValue(index)
                                                            }
                                                        />
                                                    )}
                                                </SortableList>
                                            )}
                                        </div>
                                    )}
                                </form.Subscribe>
                            </div>
                        );
                    }}
                </form.Field>
            </FormSectionCard>
        );
    },
});
