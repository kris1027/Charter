import { renderToBuffer } from '@react-pdf/renderer';
import * as legacyPdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { APP_LANGS } from '@/lib/app-lang';
import type { AppLang } from '@/lib/app-lang';
import { TEMPLATE_IDS } from '@/lib/template-ids';
import type { TemplateId } from '@/lib/template-ids';
import type { ResumeData } from '@/features/resume/form-types';
import { TemplatePDF } from '@/features/templates/pdf/template-pdf';
import { expectedAfterPrint } from '@/features/pdf/import/expected-after-print';
import { resumeFromSource } from '@/features/pdf/import/load-resume';
import { readPdfSource } from '@/features/pdf/import/read-pdf-source';
import {
    getRoundTripFixture,
    ROUND_TRIP_FIXTURE_IDS,
} from '@/features/pdf/import/round-trip-fixtures';

const render = async (templateId: TemplateId, data: ResumeData, lang: AppLang) => {
    const buffer = await renderToBuffer(
        <TemplatePDF templateId={templateId} data={data} compactScale={0} lang={lang} />,
    );
    return readPdfSource(new Uint8Array(buffer), legacyPdfjs);
};

const cases = TEMPLATE_IDS.flatMap((templateId) =>
    APP_LANGS.flatMap((lang) =>
        ROUND_TRIP_FIXTURE_IDS.map((fixtureId) => ({ templateId, lang, fixtureId })),
    ),
);

describe('PDF import round trip', () => {
    it.each(cases)(
        'should read back $templateId $lang $fixtureId when the metadata is removed',
        async ({ templateId, lang, fixtureId }) => {
            const data = getRoundTripFixture(fixtureId);
            const source = await render(templateId, data, lang);

            const result = resumeFromSource({ ...source, metadataCreator: undefined });

            expect(result).toEqual(expectedAfterPrint(data, templateId));
        },
    );

    it('should return the embedded copy when the metadata is present', async () => {
        const data = getRoundTripFixture('full');
        const source = await render('veterinary', data, 'pl');

        expect(resumeFromSource(source)).toEqual({ ...data, templateId: 'veterinary' });
    });
});
