import { createFileRoute } from '@tanstack/react-router';
import { PreviewPage } from '@/features/preview/preview-page';
import { validatePreviewSearch } from '@/features/preview/preview-search';
import { SITE_URL, routeTitleMeta } from '@/lib/seo';

export const Route = createFileRoute('/preview')({
    validateSearch: validatePreviewSearch,
    head: () => ({
        meta: [
            ...routeTitleMeta('pageTitle.preview'),
            { property: 'og:url', content: `${SITE_URL}/preview` },
        ],
        links: [{ rel: 'canonical', href: `${SITE_URL}/preview` }],
    }),
    component: PreviewPage,
});
