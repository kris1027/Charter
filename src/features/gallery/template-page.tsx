import { useParams, Link } from '@tanstack/react-router';
import { isTemplateId } from '@/lib/template-ids';
import { Button } from '@/components/ui/button';
import {
    sampleResumeData,
    sampleDefaultResumeData,
    sampleVeterinaryResumeData,
} from '@/features/resume/sample-resume-data';
import {
    sampleResumeDataPl,
    sampleDefaultResumeDataPl,
    sampleVeterinaryResumeDataPl,
} from '@/features/resume/sample-resume-data-pl';
import { ArrowLeft, Edit } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { useTranslation } from 'react-i18next';
import { ParallaxBackground } from '@/components/parallax-background';
import { PDFViewer } from '@react-pdf/renderer';
import { DeveloperPDF } from '@/features/templates/pdf/developer-pdf';
import { DefaultPDF } from '@/features/templates/pdf/default-pdf';
import { VeterinaryPDF } from '@/features/templates/pdf/veterinary-pdf';

export function TemplatePage() {
    const { t, i18n } = useTranslation();
    const { templateId } = useParams({ from: '/templates_/$templateId' });
    const isPolish = i18n.language === 'pl';

    const getTemplateName = () => {
        switch (templateId) {
            case 'developer':
                return t('templates.developer.name');
            case 'default':
                return t('templates.default.name');
            case 'veterinary':
                return t('templates.veterinary.name');
            default:
                return 'Template';
        }
    };

    const getPDFDocument = () => {
        switch (templateId) {
            case 'developer':
                return <DeveloperPDF data={isPolish ? sampleResumeDataPl : sampleResumeData} />;
            case 'default':
                return (
                    <DefaultPDF
                        data={isPolish ? sampleDefaultResumeDataPl : sampleDefaultResumeData}
                    />
                );
            case 'veterinary':
                return (
                    <VeterinaryPDF
                        data={isPolish ? sampleVeterinaryResumeDataPl : sampleVeterinaryResumeData}
                    />
                );
            default:
                return null;
        }
    };

    const pdfDocument = getPDFDocument();

    if (!pdfDocument) {
        return (
            <div className='relative min-h-screen overflow-hidden'>
                <div className='animate-gradient-shift absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/80' />
                <div className='relative z-[1] container mx-auto px-4 py-24'>
                    <div className='animate-fade-in-up mx-auto max-w-md text-center'>
                        <h1 className='font-display mb-4 text-2xl font-bold dark:text-gray-100'>
                            {t('templates.notFound')}
                        </h1>
                        <Button
                            asChild
                            className='bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl'
                        >
                            <Link to='/templates'>
                                <ArrowLeft className='mr-2 h-4 w-4' />
                                {t('nav.backToTemplates')}
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='relative flex h-screen flex-col overflow-hidden'>
            <ParallaxBackground />

            {/* Navigation Bar */}
            <div className='relative z-10 shrink-0 border-b border-white/20 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80'>
                <div className='container mx-auto px-4 py-4'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            <Button asChild variant='outline' size='sm'>
                                <Link to='/templates'>
                                    <ArrowLeft className='mr-2 h-4 w-4' />
                                    {t('nav.backToTemplates')}
                                </Link>
                            </Button>
                            <h1 className='font-display bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400'>
                                {getTemplateName()} {t('templates.preview')}
                            </h1>
                        </div>

                        <div className='flex items-center gap-3'>
                            <Button
                                asChild
                                size='sm'
                                className='bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-md'
                            >
                                <Link
                                    to='/builder'
                                    search={{
                                        templateId: isTemplateId(templateId)
                                            ? templateId
                                            : undefined,
                                    }}
                                >
                                    <Edit className='mr-2 h-4 w-4' />
                                    {t('templates.useTemplate')}
                                </Link>
                            </Button>
                            <LanguageToggle />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Preview */}
            <div className='relative z-[1] min-h-0 flex-1'>
                <PDFViewer width='100%' height='100%' showToolbar={false}>
                    {pdfDocument}
                </PDFViewer>
            </div>
        </div>
    );
}
