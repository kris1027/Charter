import { FormSectionCard } from '@/features/builder/form-sections/form-section-card';
import { resumeFormOptions, withForm } from '@/features/builder/resume-form';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PersonalInfoSection = withForm({
    ...resumeFormOptions,
    render: function Render({ form }) {
        const { t } = useTranslation();

        return (
            <FormSectionCard
                sectionId='personalInfo'
                icon={User}
                title={t('sections.personalInfo.title')}
                description={t('sections.personalInfo.description')}
            >
                <div className='space-y-6'>
                    {/* Row 1: First Name, Last Name */}
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                        <form.AppField name='personalInfo.firstName'>
                            {(field) => (
                                <field.TextField
                                    label={t('form.firstName')}
                                    placeholder={t('placeholders.firstName')}
                                    required
                                />
                            )}
                        </form.AppField>
                        <form.AppField name='personalInfo.lastName'>
                            {(field) => (
                                <field.TextField
                                    label={t('form.lastName')}
                                    placeholder={t('placeholders.lastName')}
                                    required
                                />
                            )}
                        </form.AppField>
                    </div>

                    {/* Row 2: Professional Title (full width) */}
                    <div className='grid grid-cols-1 gap-6'>
                        <form.AppField name='personalInfo.title'>
                            {(field) => (
                                <field.TextField
                                    label={t('form.professionalTitle')}
                                    placeholder={t('placeholders.professionalTitle')}
                                />
                            )}
                        </form.AppField>
                    </div>

                    {/* Row 3: Location, Email, Phone */}
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                        <form.AppField name='personalInfo.location'>
                            {(field) => (
                                <field.TextField
                                    label={t('form.location')}
                                    placeholder={t('placeholders.location')}
                                />
                            )}
                        </form.AppField>
                        <form.AppField name='personalInfo.email'>
                            {(field) => (
                                <field.TextField
                                    label={t('form.email')}
                                    placeholder={t('placeholders.email')}
                                    type='email'
                                    required
                                />
                            )}
                        </form.AppField>
                        <form.AppField name='personalInfo.phone'>
                            {(field) => (
                                <field.TextField
                                    label={t('form.phone')}
                                    placeholder={t('placeholders.phone')}
                                    type='tel'
                                />
                            )}
                        </form.AppField>
                    </div>

                    {/* Row 4: Website, LinkedIn, GitHub */}
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                        <form.AppField name='personalInfo.website'>
                            {(field) => (
                                <field.TextField
                                    label={t('form.website')}
                                    placeholder={t('placeholders.website')}
                                    type='url'
                                />
                            )}
                        </form.AppField>
                        <form.AppField name='personalInfo.linkedin'>
                            {(field) => (
                                <field.TextField
                                    label={t('form.linkedin')}
                                    placeholder={t('placeholders.linkedin')}
                                    type='url'
                                />
                            )}
                        </form.AppField>
                        <form.AppField name='personalInfo.github'>
                            {(field) => (
                                <field.TextField
                                    label={t('form.github')}
                                    placeholder={t('placeholders.github')}
                                    type='url'
                                />
                            )}
                        </form.AppField>
                    </div>
                </div>
            </FormSectionCard>
        );
    },
});
