import type { ResumeData, ResumeFormValues } from '@/features/resume/form-types';
import type { TemplateId } from '@/lib/template-ids';
import { parseDescriptionLines } from '@/features/templates/model/resume-view';
import { TEMPLATE_LAYOUTS } from '@/features/templates/model/template-layouts';

// What a resume reads back as from its printed text alone (spec 0007, AC-11): the input with
// only these losses applied. Any new loss is added here with its reason in the same change.
export function expectedAfterPrint(data: ResumeData, templateId: TemplateId): ResumeFormValues {
    const p = data.personalInfo;
    const name = `${p.firstName} ${p.lastName}`.trim();
    const space = name.indexOf(' ');
    // Split at the first separator, as a text that contains it reads back (loss 8).
    const splitFirst = (a: string, b: string, sep: string): [string, string] => {
        const i = a.indexOf(sep);
        if (i < 0) return [a, b];
        const rest = a.slice(i + sep.length).trim();
        return [a.slice(0, i).trim(), b ? `${rest} ${sep} ${b}`.trim() : rest];
    };

    return {
        // 6. The template is the detected one.
        templateId,
        personalInfo: {
            ...p,
            // 2. The first word of the printed name is the first name, the rest the last name.
            firstName: space < 0 ? name : name.slice(0, space),
            lastName: space < 0 ? '' : name.slice(space + 1),
            // 9. A contact the template does not print (default and veterinary have no GitHub).
            ...Object.fromEntries(
                (['website', 'github', 'linkedin'] as const)
                    .filter(
                        (kind) => !TEMPLATE_LAYOUTS[templateId].contactRows.flat().includes(kind),
                    )
                    .map((kind) => [kind, '']),
            ),
            // 7. Links read back as pdfjs reports them; every fixture URL comes back unchanged
            // (pdfjs keeps the trailing slash, and a bare `anna.dev` is also its printed text).
        },
        experiences: data.experiences.map((exp) => {
            const [company, position] =
                templateId === 'developer'
                    ? splitFirst(exp.company, exp.position, '|')
                    : [exp.company, exp.position];
            return {
                ...exp,
                company,
                position,
                // 8. A location containing `|` splits at the first one (developer, veterinary).
                location: exp.location,
                // 4. A current role has no end date.
                endDate: exp.current ? '' : exp.endDate,
                // 3. The description comes back as the printed bullets.
                description: parseDescriptionLines(exp.description)
                    .map((line) => `• ${line.replace(/\s+/gu, ' ')}`)
                    .join('\n'),
            };
        }),
        education: data.education.map((edu) => {
            let { degree, field } = edu;
            // 5. default and veterinary print `Degree in Field`: a lone value reads as the
            // degree, and a degree containing ` in ` splits at the first one.
            if (templateId !== 'developer') {
                const printed = degree && field ? `${degree} in ${field}` : degree || field;
                [degree, field] = splitFirst(printed, '', ' in ');
            }
            return {
                ...edu,
                degree,
                field,
                // 1. Only the years print.
                startDate: edu.startDate ? `${edu.startDate.slice(0, 4)}-01` : '',
                endDate: edu.endDate ? `${edu.endDate.slice(0, 4)}-01` : '',
            };
        }),
        skills: data.skills,
        languages: data.languages,
        interests: data.interests,
        gdprConsent: data.gdprConsent ?? { enabled: false, companyName: '' },
    };
}
