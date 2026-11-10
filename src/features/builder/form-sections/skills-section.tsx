import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { ListEmptyState } from '@/features/builder/form-sections/list-empty-state';
import { SortableChip } from '@/features/builder/form-sections/sortable-item';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { useListAnnouncer } from '@/features/builder/form-sections/use-list-announcer';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { Plus, Code } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// The schema caps a chip name at 100 characters (spec 0012, AC-21)
const MAX_NAME_LENGTH = 100;

export const SkillsSection = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();
        const [skillInput, setSkillInput] = useState('');
        const inputRef = useRef<HTMLInputElement>(null);
        const announcer = useListAnnouncer();

        return (
            <FormSectionCard
                sectionId='skills'
                icon={Code}
                title={t('sections.skills.title')}
                description={t('sections.skills.description')}
            >
                <form.Field name='skills' mode='array'>
                    {(field) => {
                        // Focus stays in the input, so the next skill can follow (AC-27)
                        const handleAdd = () => {
                            const name = skillInput.trim();
                            if (!name) return;
                            field.pushValue({ name });
                            setSkillInput('');
                            announcer.announce(t('builder.reorder.added', { item: name }));
                            inputRef.current?.focus();
                        };

                        // The chip menu has closed by the next frame, so the input keeps focus
                        const handleRemove = (index: number, name: string) => {
                            field.removeValue(index);
                            announcer.announce(t('builder.reorder.removed', { item: name }));
                            requestAnimationFrame(() => inputRef.current?.focus());
                        };

                        return (
                            <div className='space-y-4'>
                                <div className='flex gap-2'>
                                    <Input
                                        ref={inputRef}
                                        aria-label={t('placeholders.skill')}
                                        placeholder={t('placeholders.skill')}
                                        value={skillInput}
                                        maxLength={MAX_NAME_LENGTH}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            // Enter adds and never submits; an IME uses it to commit
                                            if (e.key !== 'Enter' || e.nativeEvent.isComposing) {
                                                return;
                                            }
                                            e.preventDefault();
                                            handleAdd();
                                        }}
                                    />
                                    <Button
                                        type='button'
                                        variant='outline'
                                        onClick={handleAdd}
                                        disabled={!skillInput.trim()}
                                    >
                                        <Plus aria-hidden='true' />
                                        {t('sections.skills.add')}
                                    </Button>
                                </div>

                                {/* Array mode rerenders only on its helpers; this also catches form.reset */}
                                <form.Subscribe selector={(state) => state.values.skills}>
                                    {(items) =>
                                        items.length === 0 ? (
                                            <ListEmptyState
                                                icon={Code}
                                                title={t('sections.skills.empty')}
                                                hint={t('sections.skills.emptyHint')}
                                            />
                                        ) : (
                                            <SortableList
                                                count={items.length}
                                                idPrefix='skill'
                                                strategy='horizontal'
                                                onMove={field.moveValue}
                                                onAnnounce={announcer.announce}
                                                className='flex flex-wrap gap-2'
                                            >
                                                {(index, id, controls) => (
                                                    <SortableChip
                                                        key={id}
                                                        id={id}
                                                        name={items[index].name}
                                                        removeLabel={t('accessibility.removeSkill')}
                                                        controls={controls}
                                                        onRemove={() =>
                                                            handleRemove(index, items[index].name)
                                                        }
                                                    />
                                                )}
                                            </SortableList>
                                        )
                                    }
                                </form.Subscribe>
                                <div role='status' className='sr-only'>
                                    {announcer.message}
                                </div>
                            </div>
                        );
                    }}
                </form.Field>
            </FormSectionCard>
        );
    },
});
