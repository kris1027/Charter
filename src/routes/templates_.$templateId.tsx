import { createFileRoute } from '@tanstack/react-router';
import { TemplatePage } from '@/features/gallery/template-page';
import { SITE_URL, templateTitleMeta } from '@/lib/seo';

export const Route = createFileRoute('/templates_/$templateId')({
    head: ({ params }) => {
        const url = `${SITE_URL}/templates/${params.templateId}`;

        return {
            meta: [...templateTitleMeta(params.templateId), { property: 'og:url', content: url }],
            links: [{ rel: 'canonical', href: url }],
        };
    },
    component: TemplatePage,
});
