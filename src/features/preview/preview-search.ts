import { isTemplateId, type TemplateId } from '@/lib/template-ids';

type PreviewSearch = { templateId?: TemplateId };

// /preview search params; an unknown templateId is dropped (spec 0013, AC-21).
// Plain code, not zod: route search validation ships in the main bundle on every page.
// The key is always set: the router keeps raw search values the result does not override.
export const validatePreviewSearch = (search: Record<string, unknown>): PreviewSearch => ({
    templateId: isTemplateId(search.templateId) ? search.templateId : undefined,
});

// The template the page shows: the search value, else the saved one, else developer
export const resolveTemplateId = (searchId: TemplateId | undefined, savedId: unknown): TemplateId =>
    searchId ?? (isTemplateId(savedId) ? savedId : 'developer');
