import { Button } from '@/components/ui/button';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type PreviewCvButtonProps = { size: 'sm' | 'lg' };

// withForm reads its prop types from these defaults; the page always passes a size
const DEFAULT_PROPS: PreviewCvButtonProps = { size: 'sm' };

// Preview CV, in the toolbar (sm) and at the end of the form (lg). Never disabled: an invalid
// form shows its errors and focuses the first one instead (spec 0012, AC-22, AC-23)
export const PreviewCvButton = withForm({
    ...resumeFormOptions,
    props: DEFAULT_PROPS,
    render: function Render({ form, size }) {
        const { t } = useTranslation();

        return (
            <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                    <Button
                        type='button'
                        size={size}
                        aria-busy={isSubmitting || undefined}
                        onClick={() => form.handleSubmit()}
                    >
                        {t('builder.previewCv')}
                        {size === 'lg' && <ArrowRight aria-hidden='true' />}
                    </Button>
                )}
            </form.Subscribe>
        );
    },
});
