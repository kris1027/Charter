import { createRootRoute } from '@tanstack/react-router';
import { RootLayout } from '@/app/root-layout';
import { SITE_URL, SEO_DEFAULTS, OG_DEFAULTS, pageTitle } from '@/lib/seo';

const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SEO_DEFAULTS.siteName,
    url: SITE_URL,
    description: SEO_DEFAULTS.description,
    applicationCategory: 'BusinessApplication',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
    },
    featureList: [
        'Multiple CV templates',
        'PDF export',
        'PDF import',
        'Dark mode',
        'Multilingual support (English, Polish)',
        'GDPR consent clause',
        'Auto-save',
    ],
    inLanguage: ['en', 'pl'],
};

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { title: pageTitle('pageTitle.home') },
            { name: 'description', content: SEO_DEFAULTS.description },
            { name: 'keywords', content: SEO_DEFAULTS.keywords },
            { property: 'og:site_name', content: SEO_DEFAULTS.siteName },
            { property: 'og:type', content: OG_DEFAULTS.type },
            { property: 'og:locale', content: OG_DEFAULTS.locale },
            {
                property: 'og:title',
                content: `${SEO_DEFAULTS.siteName} - Create Professional Resumes in Minutes`,
            },
            { property: 'og:description', content: SEO_DEFAULTS.description },
            { property: 'og:url', content: SITE_URL },
            { property: 'og:image', content: OG_DEFAULTS.image },
            { property: 'og:image:width', content: OG_DEFAULTS.imageWidth },
            { property: 'og:image:height', content: OG_DEFAULTS.imageHeight },
            { name: 'twitter:card', content: 'summary_large_image' },
            {
                name: 'twitter:title',
                content: `${SEO_DEFAULTS.siteName} - Create Professional Resumes in Minutes`,
            },
            { name: 'twitter:description', content: SEO_DEFAULTS.description },
            { name: 'twitter:image', content: OG_DEFAULTS.image },
        ],
        headScripts: [
            {
                type: 'application/ld+json',
                children: JSON.stringify(structuredData),
            },
        ],
        // No canonical here: each route sets its own, and a second one from the root conflicts
        links: [
            { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
            { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
            { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
            { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        ],
    }),
    component: RootLayout,
});
