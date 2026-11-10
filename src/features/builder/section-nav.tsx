import { Check } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BUILDER_SECTION_IDS,
    sectionAnchor,
    type BuilderSectionId,
} from '@/features/builder/builder-sections';
import { calculateProgress, isSectionComplete } from '@/features/builder/calculate-progress';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { useActiveSection } from '@/features/builder/use-active-section';

// The strip below the toolbar: one link per section with its check, then the percent and bar
// (spec 0012, AC-11 to AC-15). Each link and the percent select one primitive, so typing never
// redraws the strip unless that value changes
export const SectionNav = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();
        const listRef = useRef<HTMLUListElement>(null);
        const { activeId, activate } = useActiveSection(listRef);

        const renderLink = (id: BuilderSectionId) => {
            const isActive = id === activeId;

            return (
                <li key={id} className='shrink-0'>
                    <a
                        href={`#${sectionAnchor(id)}`}
                        data-section-link={id}
                        aria-current={isActive ? 'location' : undefined}
                        onClick={(event) => {
                            // Scroll and focus here, so the URL never changes
                            event.preventDefault();
                            activate(id);
                        }}
                        className={`hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-(--duration-fast) focus-visible:outline-offset-[-2px] ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
                    >
                        {t(`builder.sectionNav.${id}`)}
                        <form.Subscribe selector={(state) => isSectionComplete(id, state.values)}>
                            {(isComplete) =>
                                isComplete && (
                                    <>
                                        <Check
                                            className='text-success size-3.5'
                                            aria-hidden='true'
                                        />
                                        <span className='sr-only'>
                                            {` ${t('builder.sectionNav.completed')}`}
                                        </span>
                                    </>
                                )
                            }
                        </form.Subscribe>
                    </a>
                </li>
            );
        };

        return (
            <nav
                aria-label={t('builder.sectionNav.label')}
                className='bg-background h-11 border-b md:sticky md:top-14 md:z-10'
            >
                <div className='container mx-auto flex h-full items-center gap-3 px-4'>
                    <ul
                        ref={listRef}
                        className='relative flex min-w-0 flex-1 [scrollbar-width:none] items-center gap-1 overflow-x-auto'
                    >
                        {BUILDER_SECTION_IDS.map(renderLink)}
                    </ul>
                    <form.Subscribe selector={(state) => calculateProgress(state.values)}>
                        {(progress) => (
                            <div
                                role='progressbar'
                                aria-label={t('builder.progress.title')}
                                aria-valuenow={progress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                className='flex shrink-0 items-center gap-2'
                            >
                                <span className='text-sm font-semibold tabular-nums'>
                                    {progress}%
                                </span>
                                <div className='bg-muted hidden h-1.5 w-20 overflow-hidden rounded-full sm:block'>
                                    <div
                                        className='bg-primary ease-standard h-full rounded-full transition-[width] duration-(--duration-slow)'
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </form.Subscribe>
                </div>
            </nav>
        );
    },
});
