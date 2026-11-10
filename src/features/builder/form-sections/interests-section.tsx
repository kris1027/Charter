import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { ListEmptyState } from '@/features/builder/form-sections/list-empty-state';
import { SortableChip } from '@/features/builder/form-sections/sortable-item';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { useListAnnouncer } from '@/features/builder/form-sections/use-list-announcer';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { Plus, Heart } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// The schema caps a chip name at 100 characters (spec 0012, AC-21)
const MAX_NAME_LENGTH = 100;

export const InterestsSection = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();
        const [interestInput, setInterestInput] = useState('');
        const inputRef = useRef<HTMLInputElement>(null);
        const announcer = useListAnnouncer();

        return (
            <FormSectionCard
                sectionId='interests'
                icon={Heart}
                title={t('sections.interests.title')}
                description={t('sections.interests.description')}
            >
                <form.Field name='interests' mode='array'>
                    {(field) => {
                        // Focus stays in the input, so the next interest can follow (AC-27)
                        const handleAdd = () => {
                            const name = interestInput.trim();
                            if (!name) return;
                            field.pushValue({ name });
                            setInterestInput('');
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
                                        aria-label={t('placeholders.interest')}
                                        placeholder={t('placeholders.interest')}
                                        value={interestInput}
                                        maxLength={MAX_NAME_LENGTH}
                                        onChange={(e) => setInterestInput(e.target.value)}
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
                                        disabled={!interestInput.trim()}
                                    >
                                        <Plus aria-hidden='true' />
                                        {t('sections.interests.add')}
                                    </Button>
                                </div>

                                {/* Array mode rerenders only on its helpers; this also catches form.reset */}
                                <form.Subscribe selector={(state) => state.values.interests}>
                                    {(items) =>
                                        items.length === 0 ? (
                                            <ListEmptyState
                                                icon={Heart}
                                                title={t('sections.interests.empty')}
                                                hint={t('sections.interests.emptyHint')}
                                            />
                                        ) : (
                                            <SortableList
                                                count={items.length}
                                                idPrefix='interest'
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
                                                        removeLabel={t(
                                                            'accessibility.removeInterest',
                                                        )}
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
