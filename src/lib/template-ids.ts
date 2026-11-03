export const TEMPLATE_IDS = ['developer', 'default', 'veterinary'] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const isTemplateId = (id: unknown): id is TemplateId =>
    TEMPLATE_IDS.some((templateId) => templateId === id);
