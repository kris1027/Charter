import { useTranslation } from 'react-i18next';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import type { PreviewFit, PreviewMode } from '@/features/preview/use-preview-document';

type PreviewStripProps = {
    // Pages of the version on screen, or null while there is nothing to count
    pages: number | null;
    fit: PreviewFit;
    mode: PreviewMode;
    onModeChange: (mode: PreviewMode) => void;
};

// The 44px strip under the toolbar (spec 0013, AC-12 to AC-14): the page count with the fit
// note, and the Full size / One page switch once a one page version exists
export const PreviewStrip = ({ pages, fit, mode, onModeChange }: PreviewStripProps) => {
    const { t } = useTranslation();
    // While the search runs the switch takes its space unseen, so nothing shifts when it lands
    const isReserved = fit === 'checking';
    const hasSwitch = pages !== null && (fit === 'fits' || isReserved);

    return (
        <div className='bg-background h-11 border-b md:sticky md:top-14 md:z-10'>
            <div className='mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4'>
                <p role='status' className='text-muted-foreground min-w-0 truncate text-sm'>
                    {pages !== null && (
                        <>
                            <span className='text-foreground font-medium'>
                                {t('preview.pageCount', { count: pages })}
                            </span>
                            {fit === 'checking' && ` · ${t('preview.fit.checking')}`}
                            {fit === 'too-long' && ` · ${t('preview.fit.tooLong')}`}
                        </>
                    )}
                </p>
                {hasSwitch && (
                    <div
                        className={`shrink-0 ${isReserved ? 'invisible' : ''}`}
                        aria-hidden={isReserved || undefined}
                        inert={isReserved}
                    >
                        <SegmentedControl
                            size='sm'
                            aria-label={t('preview.mode.label')}
                            value={mode}
                            onValueChange={(value) =>
                                onModeChange(value === 'onePage' ? 'onePage' : 'full')
                            }
                        >
                            <SegmentedControlItem value='full' className='px-2 sm:px-3'>
                                {t('preview.mode.full')}
                            </SegmentedControlItem>
                            <SegmentedControlItem value='onePage' className='px-2 sm:px-3'>
                                {t('preview.mode.onePage')}
                            </SegmentedControlItem>
                        </SegmentedControl>
                    </div>
                )}
            </div>
        </div>
    );
};
