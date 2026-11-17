import IndexPage from '@/features/landing/landing-page';
import { createFileRoute } from '@tanstack/react-router';
import { SITE_URL, routeTitleMeta } from '@/lib/seo';

export const Route = createFileRoute('/')({
    head: () => ({
        meta: [...routeTitleMeta('pageTitle.home'), { property: 'og:url', content: SITE_URL }],
        links: [{ rel: 'canonical', href: SITE_URL }],
    }),
    component: IndexPage,
});
