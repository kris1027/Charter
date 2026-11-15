import { createFileRoute } from '@tanstack/react-router';
import { PreviewPage } from '@/features/preview/preview-page';
import { validatePreviewSearch } from '@/features/preview/preview-search';
import { SITE_URL, SEO_DEFAULTS } from '@/lib/seo';

export const Route = createFileRoute('/preview')({
    validateSearch: validatePreviewSearch,
    head: () => ({
        meta: [
            { title: `Preview Your CV | ${SEO_DEFAULTS.siteName}` },
            { property: 'og:title', content: `Preview Your CV | ${SEO_DEFAULTS.siteName}` },
            { property: 'og:url', content: `${SITE_URL}/preview` },
            { name: 'twitter:title', content: `Preview Your CV | ${SEO_DEFAULTS.siteName}` },
        ],
        links: [{ rel: 'canonical', href: `${SITE_URL}/preview` }],
    }),
    component: PreviewPage,
});
