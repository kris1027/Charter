import type { ResumeFormValues } from '@/features/resume/form-types';

// The contact fields a link annotation can fill.
export const CONTACT_LINK_KINDS = ['website', 'github', 'linkedin'] as const;

export type ContactLinkKind = (typeof CONTACT_LINK_KINDS)[number];

export type ContactLinks = Partial<Pick<ResumeFormValues['personalInfo'], ContactLinkKind>>;

const GITHUB = /^https?:\/\/(www\.)?github\.com\//i;
const LINKEDIN = /^https?:\/\/([a-z]{2,3}\.|www\.)?linkedin\.com\//i;
const HTTP = /^https?:\/\//i;
const OTHER_SCHEME = /^[a-z][a-z\d+.-]*:/i;

/**
 * Sort link annotation URLs into the contact fields that have no exact printed form.
 * Templates draw contact details as `<Link src={url}>`, so the URL is the stored value even
 * when the printed text is only a handle. URLs are kept exactly as pdfjs reports them.
 * A URL without a scheme is a website only when it is also printed (a bare `anna.dev`).
 */
export function contactFromLinkUrls(urls: string[], printed: readonly string[] = []): ContactLinks {
    const contact: ContactLinks = {};
    for (const url of urls) {
        if (GITHUB.test(url)) contact.github ??= url;
        else if (LINKEDIN.test(url)) contact.linkedin ??= url;
        else if (HTTP.test(url)) contact.website ??= url;
        else if (!OTHER_SCHEME.test(url) && printed.includes(url)) contact.website ??= url;
    }
    return contact;
}
