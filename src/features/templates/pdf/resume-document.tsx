import type { ComponentProps, ReactNode } from 'react';
import { Document, Page } from '@react-pdf/renderer';
import type { ResumeData } from '@/features/resume/form-types';
import { buildResumeMetadata } from '@/features/resume/resume-metadata';
import type { AppLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';
import type { ResumeView } from '@/features/templates/model/resume-view';

type ResumeDocumentProps = {
    templateId: TemplateId;
    data: ResumeData;
    view: ResumeView;
    lang: AppLang;
    pageStyle: ComponentProps<typeof Page>['style'];
    children: ReactNode;
};

// The PDF info fields and the embedded metadata the import reads first, the same for every template.
export const ResumeDocument = ({
    templateId,
    data,
    view,
    lang,
    pageStyle,
    children,
}: ResumeDocumentProps) => {
    const fullName = `${view.name.first} ${view.name.last}`;
    return (
        <Document
            title={`${fullName} - Resume`}
            author={fullName}
            subject='Professional Resume'
            keywords={view.sections.skills.items.join(', ')}
            creator={buildResumeMetadata(templateId, data)}
            language={lang}
        >
            <Page size='A4' style={pageStyle}>
                {children}
            </Page>
        </Document>
    );
};
