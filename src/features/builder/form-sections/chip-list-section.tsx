import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BuilderSectionId } from '@/features/builder/builder-sections';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { ListEmptyState } from '@/features/builder/form-sections/list-empty-state';
import { SortableChip } from '@/features/builder/form-sections/sortable-item';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { useListAnnouncer } from '@/features/builder/form-sections/use-list-announcer';
import { Plus, type LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// The schema caps a chip name at 100 characters (spec 0012, AC-21)
const MAX_NAME_LENGTH = 100;

type ChipListSectionProps = {
    // Its copy lives under sections.<sectionId>: title, description, add, empty, emptyHint
    sectionId: Extract<BuilderSectionId, 'skills' | 'interests'>;
    icon: LucideIcon;
    idPrefix: string;
    inputLabel: string;
    removeLabel: string;
    // Every chip's name, from form.Subscribe on the whole array: each chip shows its name
    names: string[];
    onAdd: (name: string) => void;
    onMove: (from: number, to: number) => void;
    onRemove: (index: number) => void;
};

// The frame shared by skills and interests: a name input with Add, the empty state or the
// sortable chips, and the section's own live region. The section owns the form field
export const ChipListSection = ({
    sectionId,
    icon,
    idPrefix,
    inputLabel,
    removeLabel,
    names,
    onAdd,
    onMove,
    onRemove,
}: ChipListSectionProps) => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const announcer = useListAnnouncer();

    // Focus stays in the input, so the next one can follow (AC-27)
    const handleAdd = () => {
        const name = input.trim();
        if (!name) return;
        onAdd(name);
        setInput('');
        announcer.announce(t('builder.reorder.added', { item: name }));
        inputRef.current?.focus();
    };

    // The chip menu has closed by the next frame, so the input keeps focus
    const handleRemove = (index: number) => {
        const name = names[index];
        onRemove(index);
        announcer.announce(t('builder.reorder.removed', { item: name }));
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    return (
        <FormSectionCard
            sectionId={sectionId}
            icon={icon}
            title={t(`sections.${sectionId}.title`)}
            description={t(`sections.${sectionId}.description`)}
        >
            <div className='space-y-4'>
                <div className='flex gap-2'>
                    <Input
                        ref={inputRef}
                        aria-label={inputLabel}
                        placeholder={inputLabel}
                        value={input}
                        maxLength={MAX_NAME_LENGTH}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            // Enter adds and never submits; an IME uses it to commit
                            if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
                            e.preventDefault();
                            handleAdd();
                        }}
                    />
                    <Button
                        type='button'
                        variant='outline'
                        onClick={handleAdd}
                        disabled={!input.trim()}
                    >
                        <Plus aria-hidden='true' />
                        {t(`sections.${sectionId}.add`)}
                    </Button>
                </div>

                {names.length === 0 ? (
                    <ListEmptyState
                        icon={icon}
                        title={t(`sections.${sectionId}.empty`)}
                        hint={t(`sections.${sectionId}.emptyHint`)}
                    />
                ) : (
                    <SortableList
                        count={names.length}
                        idPrefix={idPrefix}
                        strategy='horizontal'
                        onMove={onMove}
                        onAnnounce={announcer.announce}
                        className='flex flex-wrap gap-2'
                    >
                        {(index, id, controls) => (
                            <SortableChip
                                key={id}
                                id={id}
                                name={names[index]}
                                removeLabel={removeLabel}
                                controls={controls}
                                onRemove={() => handleRemove(index)}
                            />
                        )}
                    </SortableList>
                )}
                <div role='status' className='sr-only'>
                    {announcer.message}
                </div>
            </div>
        </FormSectionCard>
    );
};
