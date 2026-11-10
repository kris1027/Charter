import { Checkbox } from '@/components/ui/checkbox';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fieldA11y } from '@/features/builder/fields/field-a11y';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { ShieldCheck } from 'lucide-react';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { useTranslation } from 'react-i18next';

const COMPANY_ID = 'gdpr-company';
const COMPANY_HINT_ID = 'gdpr-company-hint';

// Keeps its own ids (gdpr-enabled, gdpr-company) and hint, so it uses form.Field directly
export const GdprConsentSection = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();

        return (
            <FormSectionCard
                sectionId='gdprConsent'
                icon={ShieldCheck}
                title={t('sections.gdprConsent.title')}
                description={t('sections.gdprConsent.description')}
            >
                <div className='space-y-4'>
                    <form.Field name='gdprConsent.enabled'>
                        {(field) => (
                            <div className='bg-muted/50 flex items-center gap-2 rounded-lg border p-3'>
                                <Checkbox
                                    id='gdpr-enabled'
                                    checked={field.state.value}
                                    onCheckedChange={(checked) => field.handleChange(!!checked)}
                                />
                                <Label htmlFor='gdpr-enabled' className='cursor-pointer'>
                                    {t('sections.gdprConsent.enable')}
                                </Label>
                            </div>
                        )}
                    </form.Field>

                    <form.Field name='gdprConsent.enabled'>
                        {(enabledField) =>
                            enabledField.state.value ? (
                                <form.Field name='gdprConsent.companyName'>
                                    {(field) => {
                                        const { errors, isTouched } = field.state.meta;
                                        const { errorId, ariaProps } = fieldA11y(
                                            COMPANY_ID,
                                            field.state.meta,
                                            COMPANY_HINT_ID,
                                        );

                                        return (
                                            <div className='space-y-2'>
                                                <Label htmlFor={COMPANY_ID}>
                                                    {t('sections.gdprConsent.companyName')}
                                                </Label>
                                                <Input
                                                    id={COMPANY_ID}
                                                    placeholder={t(
                                                        'sections.gdprConsent.companyNamePlaceholder',
                                                    )}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) =>
                                                        field.handleChange(e.target.value)
                                                    }
                                                    {...ariaProps}
                                                />
                                                <FieldError
                                                    id={errorId}
                                                    errors={errors}
                                                    isTouched={isTouched}
                                                />
                                                <p
                                                    id={COMPANY_HINT_ID}
                                                    className='text-muted-foreground text-xs'
                                                >
                                                    {t('sections.gdprConsent.companyNameHint')}
                                                </p>
                                            </div>
                                        );
                                    }}
                                </form.Field>
                            ) : null
                        }
                    </form.Field>
                </div>
            </FormSectionCard>
        );
    },
});
