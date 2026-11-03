import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { DragHandle } from '@/features/builder/form-sections/sortable-item';
import { SortableList } from '@/features/builder/form-sections/sortable-list';
import { useSortableItem } from '@/features/builder/form-sections/use-sortable-item';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { Plus, Code, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type SkillChipProps = {
    id: string;
    name: string;
    onRemove: () => void;
};

const SkillChip = ({ id, name, onRemove }: SkillChipProps) => {
    const { t } = useTranslation();
    const { setNodeRef, style, isDragging, handleProps } = useSortableItem(id);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-1 rounded-full border border-slate-200/60 bg-white/60 px-3 py-1.5 backdrop-blur-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-white/[0.05] dark:hover:shadow-indigo-500/5 ${isDragging ? 'shadow-lg ring-2 ring-indigo-500/20' : ''}`}
        >
            <DragHandle handleProps={handleProps} size='sm' />
            <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>{name}</span>
            <button
                type='button'
                onClick={onRemove}
                className='opacity-0 transition-opacity group-hover:opacity-100'
                aria-label={t('accessibility.removeSkill')}
            >
                <X className='h-3 w-3 text-slate-400 hover:text-red-500' />
            </button>
        </div>
    );
};

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

                                <div>
                                    {field.state.value.length === 0 ? (
                                        <div className='py-8 text-center'>
                                            <div className='mx-auto mb-3 inline-flex rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 text-white/60 shadow-inner'>
                                                <Code className='h-6 w-6' />
                                            </div>
                                            <p className='font-display font-medium text-slate-500 dark:text-slate-400'>
                                                {t('sections.skills.empty')}
                                            </p>
                                            <p className='mt-1 text-sm text-slate-400 dark:text-slate-500'>
                                                {t('sections.skills.emptyHint')}
                                            </p>
                                        </div>
                                    ) : (
                                        <SortableList
                                            items={field.state.value}
                                            idPrefix='skill'
                                            strategy='horizontal'
                                            onMove={field.moveValue}
                                            className='flex flex-wrap gap-2'
                                        >
                                            {(item, index, id) => (
                                                <SkillChip
                                                    key={id}
                                                    id={id}
                                                    name={item.name}
                                                    onRemove={() => field.removeValue(index)}
                                                />
                                            )}
                                        </SortableList>
                                    )}
                                </div>
                            </div>
                        );
                    }}
                </form.Field>
            </FormSectionCard>
        );
    },
});
