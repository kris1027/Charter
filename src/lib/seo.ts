import i18n from '@/i18n/config';
import { isTemplateId } from '@/lib/template-ids';
import type enTranslation from '@/locales/en/translation.json';

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

/** A key under `pageTitle` in the locale files, so a typo fails the typecheck. */
export type PageTitleKey = `pageTitle.${keyof (typeof enTranslation)['pageTitle']}`;

/** A page title in the visitor's language, or in `lng` when given. */
export const pageTitle = (key: PageTitleKey, options?: { name?: string; lng?: string }) =>
    i18n.t(key, options);

/**
 * A route's title meta (WCAG 2.4.2, spec 0014): the tab title in the visitor's language, and og
 * and twitter titles in English, like `og:locale`, since crawlers see the English page. Routes
 * spread it into `head`; the root layout reruns `head` on a language change.
 */
const titleMeta = (titleIn: (lng?: string) => string) => {
    const shareTitle = titleIn('en');
    return [
        { title: titleIn() },
        { property: 'og:title', content: shareTitle },
        { name: 'twitter:title', content: shareTitle },
    ];
};

export const routeTitleMeta = (key: PageTitleKey) =>
    titleMeta((lng) => pageTitle(key, lng ? { lng } : undefined));

/** The template detail page's title meta, naming the template in each language. */
export const templateTitleMeta = (templateId: string) =>
    titleMeta((lng) =>
        pageTitle('pageTitle.template', {
            name: isTemplateId(templateId)
                ? i18n.t(`templates.${templateId}.name`, lng ? { lng } : undefined)
                : templateId,
            ...(lng && { lng }),
        }),
    );
