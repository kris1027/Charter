import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { ShieldCheck } from 'lucide-react';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { useTranslation } from 'react-i18next';

// Keeps its own ids (gdpr-enabled, gdpr-company) and hint, so it uses form.Field directly
export const GdprConsentSection = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();

        return (
            <FormSectionCard
                icon={ShieldCheck}
                iconGradient='from-emerald-500 to-green-600'
                title={t('sections.gdprConsent.title')}
                description={t('sections.gdprConsent.description')}
            >
                <div className='space-y-4'>
                    <form.Field name='gdprConsent.enabled'>
                        {(field) => (
                            <div className='flex items-center space-x-2 rounded-lg border border-slate-200/60 bg-slate-50/60 p-3 dark:border-white/5 dark:bg-white/[0.03]'>
                                <Checkbox
                                    id='gdpr-enabled'
                                    checked={field.state.value}
                                    onCheckedChange={(checked) => field.handleChange(!!checked)}
                                />
                                <Label
                                    htmlFor='gdpr-enabled'
                                    className='cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300'
                                >
                                    {t('sections.gdprConsent.enable')}
                                </Label>
                            </div>
                        )}
                    </form.Field>

                    <form.Field name='gdprConsent.enabled'>
                        {(enabledField) =>
                            enabledField.state.value ? (
                                <form.Field name='gdprConsent.companyName'>
                                    {(field) => (
                                        <div className='space-y-2'>
                                            <Label
                                                htmlFor='gdpr-company'
                                                className='text-sm font-medium text-slate-700 dark:text-slate-300'
                                            >
                                                {t('sections.gdprConsent.companyName')}
                                            </Label>
                                            <Input
                                                id='gdpr-company'
                                                placeholder={t(
                                                    'sections.gdprConsent.companyNamePlaceholder',
                                                )}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                aria-describedby='gdpr-company-hint'
                                            />
                                            <p
                                                id='gdpr-company-hint'
                                                className='text-xs text-slate-500 dark:text-slate-400'
                                            >
                                                {t('sections.gdprConsent.companyNameHint')}
                                            </p>
                                        </div>
                                    )}
                                </form.Field>
                            ) : null
                        }
                    </form.Field>
                </div>
            </FormSectionCard>
        );
    },
});
