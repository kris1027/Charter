import type { ResumeFormValues } from '@/features/resume/form-types';
import type { TemplateId } from '@/lib/template-ids';
import { formatGithubDisplay, formatLinkedinDisplay, formatWebsiteDisplay } from '@/lib/utils';
import type { ContactKind } from '@/features/templates/model/template-layouts';
import { TEMPLATE_LAYOUTS } from '@/features/templates/model/template-layouts';
import { contactFromLinkUrls } from '@/features/pdf/import/contact-links';
import { lineSize } from '@/features/pdf/import/readers/shared';
import { cells, lineText } from '@/features/pdf/import/text-lines';
import type { TextLine } from '@/features/pdf/import/text-lines';

type PersonalInfo = ResumeFormValues['personalInfo'];
type LinkKind = 'website' | 'github' | 'linkedin';

export type HeaderCtx = { templateId: TemplateId; linkUrls: readonly string[] };

const DISPLAY: Record<LinkKind, (url: string) => string> = {
    website: formatWebsiteDisplay,
    github: formatGithubDisplay,
    linkedin: formatLinkedinDisplay,
};

const isPhone = (text: string) =>
    /^[\d\s+()-]+$/u.test(text) && (text.match(/\d/gu)?.length ?? 0) >= 7;

// Which printed cell may hold a kind when no link annotation says so (a PDF printed again).
const FITS: Record<ContactKind, (text: string) => boolean> = {
    website: (text) => /^\S+\.\S+$/u.test(text),
    github: (text) => /^[\w-]+$/u.test(text),
    linkedin: (text) => /^[\w-]+$/u.test(text),
    location: (text) => /[\s,]|[^\p{ASCII}]/u.test(text),
    email: () => false,
    phone: () => false,
};

// A printed handle or address back into the URL the form stores.
const REBUILD: Record<LinkKind, (text: string) => string> = {
    website: (text) => (/^https?:\/\//iu.test(text) ? text : `https://${text}`),
    github: (handle) => `https://github.com/${handle}`,
    linkedin: (handle) => `https://linkedin.com/in/${handle}`,
};

/**
 * Personal info from the lines above the first section. The first line is the name, the next
 * the title when printed larger than the contact text, then the contact cells. Website, GitHub
 * and LinkedIn come from the link annotations when the PDF has them, else from the printed
 * cells in the template's contact row order.
 */
export function readHeader(lines: readonly TextLine[], ctx: HeaderCtx): PersonalInfo {
    const info: PersonalInfo = {
        firstName: '',
        lastName: '',
        location: '',
        title: '',
        phone: '',
        email: '',
        website: '',
        linkedin: '',
        github: '',
    };
    if (lines.length === 0) return info;

    const name = lineText(lines[0]);
    const space = name.indexOf(' ');
    info.firstName = space < 0 ? name : name.slice(0, space);
    info.lastName = space < 0 ? '' : name.slice(space + 1);

    const contactSize = Math.min(
        ...lines.map((line) => Math.min(...line.runs.map((r) => r.fontSize))),
    );
    let rest = lines.slice(1);
    if (rest[0] && lineSize(rest[0]) > contactSize) {
        info.title = lineText(rest[0]);
        rest = rest.slice(1);
    }

    const printed = rest.flatMap((line) => cells(line));
    const links = contactFromLinkUrls([...ctx.linkUrls], printed);
    const left: string[] = [];
    for (const text of printed) {
        if (!info.email && text.includes('@')) info.email = text;
        else if (!info.phone && isPhone(text)) info.phone = text;
        else {
            const kind = (Object.keys(links) as LinkKind[]).find((k) => {
                const url = links[k];
                return url !== undefined && (DISPLAY[k](url) === text || url === text);
            });
            if (kind && !info[kind]) info[kind] = links[kind] ?? '';
            else left.push(text);
        }
    }

    // With link annotations every printed link is annotated, so the one cell left is the
    // location. Without them (a PDF printed again), the kinds still missing in the order the
    // template prints them: a cell takes the first that fits, the last kind left takes any.
    const kinds =
        ctx.linkUrls.length > 0
            ? (['location'] as const)
            : TEMPLATE_LAYOUTS[ctx.templateId].contactRows
                  .flat()
                  .filter(
                      (kind): kind is LinkKind | 'location' => kind !== 'email' && kind !== 'phone',
                  )
                  .filter((kind) => !info[kind]);
    let k = 0;
    for (const text of left) {
        while (k < kinds.length - 1 && !FITS[kinds[k]](text)) k++;
        const kind = kinds[k++];
        if (!kind) break;
        info[kind] = kind === 'location' ? text : REBUILD[kind](text);
    }
    return info;
}
