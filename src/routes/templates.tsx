import { createFileRoute } from '@tanstack/react-router';
import { TemplatesPage } from '@/features/gallery/templates-page';
import { SITE_URL, routeTitleMeta } from '@/lib/seo';

export const Route = createFileRoute('/templates')({
    head: () => ({
        meta: [
            ...routeTitleMeta('pageTitle.templates'),
            { property: 'og:url', content: `${SITE_URL}/templates` },
        ],
        links: [{ rel: 'canonical', href: `${SITE_URL}/templates` }],
    }),
    component: TemplatesPage,
});
