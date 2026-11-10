import { Button } from '@/components/ui/button';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { useTranslation } from 'react-i18next';

// The way to /preview when the live preview cannot run: the same submit as Preview CV, never
// disabled (spec 0012, AC-22). From the sheet, a failed submit closes it first (AC-24). Outline,
// since only Preview CV takes the default variant (AC-19)
export const OpenPreviewButton = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();

        return (
            <Button type='button' variant='outline' size='sm' onClick={() => form.handleSubmit()}>
                {t('builder.livePreview.openPreviewPage')}
            </Button>
        );
    },
});
