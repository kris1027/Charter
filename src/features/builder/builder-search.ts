import { isTemplateId, type TemplateId } from '@/lib/template-ids';

type BuilderSearch = { templateId?: TemplateId };

// /builder search params; an unknown templateId is dropped, not passed on (spec 0005).
// Plain code, not zod: route search validation ships in the main bundle on every page.
// The key is always set: the router keeps raw search values the result does not override.
export const validateBuilderSearch = (search: Record<string, unknown>): BuilderSearch => ({
    templateId: isTemplateId(search.templateId) ? search.templateId : undefined,
});
