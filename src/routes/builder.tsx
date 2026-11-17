import BuilderPage from '@/features/builder/builder-page';
import { validateBuilderSearch } from '@/features/builder/builder-search';
import { createFileRoute } from '@tanstack/react-router';
import { SITE_URL, routeTitleMeta } from '@/lib/seo';

export const Route = createFileRoute('/builder')({
    validateSearch: validateBuilderSearch,
    head: () => ({
        meta: [
            ...routeTitleMeta('pageTitle.builder'),
            { property: 'og:url', content: `${SITE_URL}/builder` },
        ],
        links: [{ rel: 'canonical', href: `${SITE_URL}/builder` }],
    }),
    component: BuilderPage,
});
