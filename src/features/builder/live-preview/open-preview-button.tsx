import { Button } from '@/components/ui/button';
import { canOpenPreview } from '@/features/builder/calculate-progress';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { useTranslation } from 'react-i18next';

// The way to /preview when the live preview cannot run: the same submit and gate as Preview CV
export const OpenPreviewButton = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();

        return (
            <form.Subscribe selector={canOpenPreview}>
                {(canOpen) => (
                    <Button
                        type='button'
                        size='sm'
                        disabled={!canOpen}
                        onClick={() => form.handleSubmit()}
                    >
                        {t('builder.livePreview.openPreviewPage')}
                    </Button>
                )}
            </form.Subscribe>
        );
    },
});
