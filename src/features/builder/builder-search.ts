import { z } from 'zod';
import { TEMPLATE_IDS } from '@/lib/template-ids';

// /builder search params; an unknown templateId is dropped, not passed on (spec 0005)
export const builderSearchSchema = z.object({
    templateId: z.enum(TEMPLATE_IDS).optional().catch(undefined),
});
