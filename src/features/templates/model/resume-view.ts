import type { ResumeData } from '@/features/resume/form-types';
import type { AppLang } from '@/lib/app-lang';
import type { TemplateId } from '@/lib/template-ids';
import { formatCVDate, formatCVDateShort, formatCVYear } from '@/lib/date-format';
import { formatGithubDisplay, formatLinkedinDisplay, formatWebsiteDisplay } from '@/lib/utils';
import { printedTitle } from '@/features/templates/model/printed-title';
import type { ContactKind } from '@/features/templates/model/template-layouts';
import { TEMPLATE_LAYOUTS } from '@/features/templates/model/template-layouts';
import { getPDFStrings } from '@/features/templates/model/template-strings';

export type ContactItem = { kind: ContactKind; text: string; href: string | null };

export type Section<T> = { title: string; items: T[] };

export type ExperienceItem = {
    position: string;
    company: string;
    location: string;
    start: string;
    end: string;
    bullets: string[];
};

export type EducationItem = {
    degree: string;
    field: string;
    institution: string;
    startYear: string;
    endYear: string;
    description: string;
};

export type LanguageItem = { name: string; level: string };

// Everything a template prints, already formatted, so renderers never format anything.
export type ResumeView = {
    name: { first: string; last: string };
    title: string;
    contactRows: ContactItem[][];
    sections: {
        experience: Section<ExperienceItem>;
        education: Section<EducationItem>;
        skills: Section<string>;
        languages: Section<LanguageItem>;
        interests: Section<string>;
    };
    gdpr: string | null;
};

export const parseDescriptionLines = (description: string): string[] =>
    description
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => l.replace(/^[-*•‣◦⁃∙]\s*/, ''));

export const buildResumeView = (
    templateId: TemplateId,
    data: ResumeData,
    lang: AppLang,
): ResumeView => {
    const layout = TEMPLATE_LAYOUTS[templateId];
    const str = getPDFStrings(lang);
    const p = data.personalInfo;
    const formatDate = layout.dateStyle === 'long' ? formatCVDate : formatCVDateShort;
    const title = (id: keyof ResumeView['sections']) => printedTitle(templateId, id, lang);

    const contact = (kind: ContactKind): ContactItem | null => {
        const value = p[kind];
        if (!value) return null;
        switch (kind) {
            case 'location':
                return { kind, text: value, href: null };
            case 'email':
                return { kind, text: value, href: `mailto:${value}` };
            case 'phone':
                return { kind, text: value, href: `tel:${value}` };
            case 'linkedin':
                return { kind, text: formatLinkedinDisplay(value), href: value };
            case 'github':
                return { kind, text: formatGithubDisplay(value), href: value };
            case 'website':
                return {
                    kind,
                    text: layout.websiteDisplay === 'short' ? formatWebsiteDisplay(value) : value,
                    href: value,
                };
        }
    };

    const gdpr = data.gdprConsent;

    return {
        name: { first: p.firstName, last: p.lastName },
        title: p.title,
        contactRows: layout.contactRows
            .map((row) => row.map(contact).filter((item) => item !== null))
            .filter((row) => row.length > 0),
        sections: {
            experience: {
                title: title('experience'),
                items: data.experiences.map((exp) => ({
                    position: exp.position,
                    company: exp.company,
                    location: exp.location,
                    start: formatDate(exp.startDate, lang),
                    end: exp.current ? str.present : formatDate(exp.endDate, lang),
                    bullets: parseDescriptionLines(exp.description),
                })),
            },
            education: {
                title: title('education'),
                items: data.education.map((edu) => ({
                    degree: edu.degree,
                    field: edu.field,
                    institution: edu.institution,
                    startYear: formatCVYear(edu.startDate),
                    endYear: formatCVYear(edu.endDate),
                    description: edu.description,
                })),
            },
            skills: { title: title('skills'), items: data.skills.map((s) => s.name) },
            languages: {
                title: title('languages'),
                items: data.languages.map((l) => ({
                    name: l.language,
                    level: l.proficiency === 'NATIVE' ? str.native : l.proficiency,
                })),
            },
            interests: { title: title('interests'), items: data.interests.map((i) => i.name) },
        },
        gdpr: !gdpr?.enabled
            ? null
            : gdpr.companyName?.trim()
              ? str.gdprConsent(gdpr.companyName)
              : str.gdprConsentGeneric,
    };
};
