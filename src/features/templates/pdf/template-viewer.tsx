import { PDFViewer } from '@react-pdf/renderer';
import { TemplatePDF } from '@/features/templates/pdf/template-pdf';
import type { ResumeData } from '@/features/resume/form-types';
import type { TemplateId } from '@/lib/template-ids';
import type { AppLang } from '@/lib/app-lang';

export type TemplateViewerProps = {
    data: ResumeData;
    templateId: TemplateId;
    compactScale: number;
    lang: AppLang;
};

// On screen PDF of one template. Load it through LazyTemplateViewer so the
// @react-pdf engine stays out of the page's first load (spec 0008)
const TemplateViewer = ({ data, templateId, compactScale, lang }: TemplateViewerProps) => (
    <PDFViewer width='100%' height='100%' showToolbar={false}>
        <TemplatePDF data={data} templateId={templateId} compactScale={compactScale} lang={lang} />
    </PDFViewer>
);

export default TemplateViewer;
