import BuilderPage from '@/features/builder/builder-page';
import { validateBuilderSearch } from '@/features/builder/builder-search';
import { createFileRoute } from '@tanstack/react-router';
import { SITE_URL, SEO_DEFAULTS } from '@/lib/seo';

export const Route = createFileRoute('/builder')({
    validateSearch: validateBuilderSearch,
    head: () => ({
        meta: [
            { title: `Build Your CV | ${SEO_DEFAULTS.siteName}` },
            { property: 'og:title', content: `Build Your CV | ${SEO_DEFAULTS.siteName}` },
            { property: 'og:url', content: `${SITE_URL}/builder` },
            { name: 'twitter:title', content: `Build Your CV | ${SEO_DEFAULTS.siteName}` },
        ],
        links: [{ rel: 'canonical', href: `${SITE_URL}/builder` }],
    }),
    component: BuilderPage,
});
