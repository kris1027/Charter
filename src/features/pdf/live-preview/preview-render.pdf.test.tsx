import { renderToBuffer } from '@react-pdf/renderer';
import { describe, expect, it } from 'vitest';
import { toPreviewInput } from '@/features/pdf/live-preview/preview-protocol';
import type { ResumeFormValues } from '@/features/resume/form-types';
import { EMPTY_RESUME, normalizeResume } from '@/features/resume/stored-resume';
import type { StoredResume } from '@/features/resume/stored-resume';
import { TemplatePDF } from '@/features/templates/pdf/template-pdf';
import { TEMPLATE_IDS } from '@/lib/template-ids';
import longResume from '@/test/fixtures/long-resume.json';

// Spec 0009, AC-6 and AC-9: the input the live preview worker builds renders for every
// template, from the long resume down to an empty form
const longValues = normalizeResume(longResume as Partial<StoredResume>) as Omit<
    ResumeFormValues,
    'templateId'
>;

const cases = TEMPLATE_IDS.flatMap((templateId) => [
    { templateId, fixture: 'long', values: { ...longValues, templateId } },
    { templateId, fixture: 'empty', values: { ...EMPTY_RESUME, templateId } },
]);

describe('live preview render input', () => {
    it.each(cases)(
        'should render a non empty PDF for $templateId when the form is $fixture',
        async ({ values }) => {
            const buffer = await renderToBuffer(<TemplatePDF {...toPreviewInput(values, 'en')} />);

            expect(buffer.byteLength).toBeGreaterThan(1000);
            expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
        },
    );
});
