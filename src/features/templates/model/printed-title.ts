import type { AppLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';
import type { SectionId } from '@/features/templates/model/section-ids';
import { TEMPLATE_LAYOUTS } from '@/features/templates/model/template-layouts';
import { getPDFStrings } from '@/features/templates/model/template-strings';

// The exact section header a template prints, shared by the render and the import parser.
export const printedTitle = (templateId: TemplateId, sectionId: SectionId, lang: AppLang): string =>
    TEMPLATE_LAYOUTS[templateId].titles[sectionId](getPDFStrings(lang));
