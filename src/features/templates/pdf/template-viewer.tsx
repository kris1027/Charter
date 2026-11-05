import { PDFViewer } from '@react-pdf/renderer';
import { TemplatePDF, type TemplatePdfInput } from '@/features/templates/pdf/template-pdf';

// On screen PDF of one template. Load it through LazyTemplateViewer so the
// @react-pdf engine stays out of the page's first load (spec 0008)
const TemplateViewer = (props: TemplatePdfInput) => (
    <PDFViewer width='100%' height='100%' showToolbar={false}>
        <TemplatePDF {...props} />
    </PDFViewer>
);

export default TemplateViewer;
