import { Button } from '@/components/ui/button';
import type { BuilderSectionId } from '@/features/builder/builder-sections';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { ListEmptyState } from '@/features/builder/form-sections/list-empty-state';
import type { ItemMoveControls } from '@/features/builder/form-sections/sortable-ids';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { useListAnnouncer } from '@/features/builder/form-sections/use-list-announcer';
import { Plus, type LucideIcon } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type CardListSectionProps = {
    sectionId: Extract<BuilderSectionId, 'experiences' | 'education' | 'languages'>;
    // Its copy lives under sections.<copyKey>: title, description, add, empty, emptyHint, item
    copyKey: 'experience' | 'education' | 'languages';
    icon: LucideIcon;
    idPrefix: string;
    // The list length only (from form.Subscribe), so typing in a card redraws one field
    count: number;
    // Adds an item and focuses its first field (spec 0012, AC-27)
    onAdd: () => void;
    onMove: (from: number, to: number) => void;
    onRemove: (index: number) => void;
    children: (
        index: number,
        id: string,
        controls: ItemMoveControls,
        onRemove: () => void,
    ) => ReactNode;
};

// The frame shared by experience, education and languages: Add in the header, the empty state or
// the sortable cards, and the section's own live region. The section owns the form field and
// renders each card through children
export const CardListSection = ({
    sectionId,
    copyKey,
    icon,
    idPrefix,
    count,
    onAdd,
    onMove,
    onRemove,
    children,
}: CardListSectionProps) => {
    const { t } = useTranslation();
    const addButtonRef = useRef<HTMLButtonElement>(null);
    const announcer = useListAnnouncer();
    // Focus goes to Add, which stays mounted when the list empties (AC-28)
    const handleRemove = (index: number) => {
        const item = t(`sections.${copyKey}.item`, { number: index + 1 });
        onRemove(index);
        announcer.announce(t('builder.reorder.removed', { item }));
        addButtonRef.current?.focus();
    };

    return (
        <FormSectionCard
            sectionId={sectionId}
            icon={icon}
            title={t(`sections.${copyKey}.title`)}
            description={t(`sections.${copyKey}.description`)}
            headerAction={
                <Button ref={addButtonRef} type='button' variant='outline' onClick={onAdd}>
                    <Plus aria-hidden='true' />
                    {t(`sections.${copyKey}.add`)}
                </Button>
            }
        >
            <div className='space-y-4'>
                {count === 0 ? (
                    <ListEmptyState
                        icon={icon}
                        title={t(`sections.${copyKey}.empty`)}
                        hint={t(`sections.${copyKey}.emptyHint`)}
                    />
                ) : (
                    <SortableList
                        count={count}
                        idPrefix={idPrefix}
                        strategy='vertical'
                        onMove={onMove}
                        onAnnounce={announcer.announce}
                        className='space-y-4'
                    >
                        {(index, id, controls) =>
                            children(index, id, controls, () => handleRemove(index))
                        }
                    </SortableList>
                )}
            </div>
            <div role='status' className='sr-only'>
                {announcer.message}
            </div>
        </FormSectionCard>
    );
};
