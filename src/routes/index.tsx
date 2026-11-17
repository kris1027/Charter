import IndexPage from '@/features/landing/landing-page';
import { createFileRoute } from '@tanstack/react-router';
import { SITE_URL, SEO_DEFAULTS, pageTitle } from '@/lib/seo';

export const Route = createFileRoute('/')({
    head: () => ({
        meta: [
            { title: pageTitle('pageTitle.home') },
            {
                property: 'og:title',
                content: `${SEO_DEFAULTS.siteName} - Create Professional Resumes in Minutes`,
            },
            { property: 'og:url', content: SITE_URL },
            {
                name: 'twitter:title',
                content: `${SEO_DEFAULTS.siteName} - Create Professional Resumes in Minutes`,
            },
        ],
        links: [{ rel: 'canonical', href: SITE_URL }],
    }),
    component: IndexPage,
});
