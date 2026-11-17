import { createFileRoute } from '@tanstack/react-router';
import { TemplatesPage } from '@/features/gallery/templates-page';
import { SITE_URL, SEO_DEFAULTS, pageTitle } from '@/lib/seo';

export const Route = createFileRoute('/templates')({
    head: () => ({
        meta: [
            { title: pageTitle('pageTitle.templates') },
            { property: 'og:title', content: `CV Templates | ${SEO_DEFAULTS.siteName}` },
            { property: 'og:url', content: `${SITE_URL}/templates` },
            { name: 'twitter:title', content: `CV Templates | ${SEO_DEFAULTS.siteName}` },
        ],
        links: [{ rel: 'canonical', href: `${SITE_URL}/templates` }],
    }),
    component: TemplatesPage,
});
