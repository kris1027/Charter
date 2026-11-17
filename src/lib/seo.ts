import i18n from '@/i18n/config';
import type { TemplateId } from '@/lib/template-ids';

if (!import.meta.env.VITE_SITE_URL) {
    throw new Error(
        'VITE_SITE_URL environment variable is not set. ' +
            'Please configure it in your .env file (see .env.example).',
    );
}

export const SITE_URL = import.meta.env.VITE_SITE_URL;

export const SEO_DEFAULTS = {
    siteName: 'Charter',
    description:
        'Create professional resumes with our free resume builder. Choose from multiple templates, customize your layout, and export to PDF in minutes.',
    keywords:
        'resume builder, cv builder, free resume maker, professional resume, pdf resume, cv templates, resume templates',
} as const;

export const OG_DEFAULTS = {
    image: `${SITE_URL}/og-image.png`,
    imageWidth: '1200',
    imageHeight: '630',
    type: 'website',
    locale: 'en_US',
} as const;

export const TEMPLATE_NAMES: Record<TemplateId, string> = {
    developer: 'Developer',
    default: 'Default',
    veterinary: 'Veterinary',
} as const;

/**
 * The tab title in the visitor's language (WCAG 2.4.2, spec 0014). Routes read it in `head`, and
 * the root layout reruns `head` on a language change; og and twitter titles stay English, like
 * `og:locale`, since crawlers see the English page.
 */
export const pageTitle = (key: `pageTitle.${string}`, options?: Record<string, string>) =>
    i18n.t(key, options);
