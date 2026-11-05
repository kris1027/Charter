import type { ResumeFormValues } from '@/features/resume/form-types';
import type { TemplatePdfInput } from '@/features/templates/pdf/template-pdf';
import type { AppLang } from '@/lib/app-lang';

// Messages between the builder and the live preview worker (spec 0009)
export type PreviewRequest = { type: 'render'; seq: number; input: TemplatePdfInput };

export type PreviewResponse =
    | { type: 'ready' }
    | { type: 'rendered'; seq: number; pdf: ArrayBuffer }
    | { type: 'failed'; seq: number };

// What the builder asks the worker to render: the form values as typed (valid or not, since
// ResumeFormValues fits ResumeData), the form's template, full size (no one page fit)
export const toPreviewInput = (values: ResumeFormValues, lang: AppLang): TemplatePdfInput => ({
    data: values,
    templateId: values.templateId,
    compactScale: 0,
    lang,
});
