import { createFileRoute } from '@tanstack/react-router';
import { TemplatePage } from '@/features/gallery/template-page';
import i18n from '@/i18n/config';
import { SITE_URL, SEO_DEFAULTS, TEMPLATE_NAMES, pageTitle } from '@/lib/seo';
import { isTemplateId } from '@/lib/template-ids';
import type { TemplateId } from '@/lib/template-ids';

export const Route = createFileRoute('/templates_/$templateId')({
    head: ({ params }) => {
        const templateName = TEMPLATE_NAMES[params.templateId as TemplateId] ?? params.templateId;
        const title = `${templateName} Template | ${SEO_DEFAULTS.siteName}`;
        const url = `${SITE_URL}/templates/${params.templateId}`;

        return {
            meta: [
                {
                    title: isTemplateId(params.templateId)
                        ? pageTitle('pageTitle.template', {
                              name: i18n.t(`templates.${params.templateId}.name`),
                          })
                        : title,
                },
                { property: 'og:title', content: title },
                { property: 'og:url', content: url },
                { name: 'twitter:title', content: title },
            ],
            links: [{ rel: 'canonical', href: url }],
        };
    },
    component: TemplatePage,
});
