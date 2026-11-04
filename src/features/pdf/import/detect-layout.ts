import { APP_LANGS } from '@/lib/app-lang';
import type { AppLang } from '@/lib/app-lang';
import { TEMPLATE_IDS } from '@/lib/template-ids';
import type { TemplateId } from '@/lib/template-ids';
import { SECTION_IDS } from '@/features/templates/model/section-ids';
import { findHeaderIndex } from '@/features/pdf/import/section-headers';
import type { TextLine } from '@/features/pdf/import/text-lines';

export type Detected = { templateId: TemplateId; lang: AppLang; headerHits: number };

// The template and language whose printed section headers the PDF matches most often.
// Ties go to the first template in TEMPLATE_IDS, then the first language in APP_LANGS.
export function detectLayout(lines: readonly TextLine[]): Detected | null {
    let best: Detected | null = null;
    for (const templateId of TEMPLATE_IDS) {
        for (const lang of APP_LANGS) {
            const headerHits = SECTION_IDS.filter(
                (id) => findHeaderIndex(lines, templateId, id, lang) >= 0,
            ).length;
            if (headerHits > (best?.headerHits ?? 0)) best = { templateId, lang, headerHits };
        }
    }
    return best;
}
