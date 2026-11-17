// What both audits point at (spec 0014): the `vite preview` server and the pages on it. Lighthouse
// (lighthouserc.cjs, which Node loads with require, types stripped), the axe matrix and the preview
// server read them from here. `pnpm a11y` and the CI build pass the same origin as VITE_SITE_URL.
export const PREVIEW_PORT = 4173;
export const PREVIEW_ORIGIN = `http://localhost:${PREVIEW_PORT}`;

export const AUDITED_PAGES = [
    '/',
    '/templates',
    '/templates/developer',
    '/builder',
    '/preview',
] as const;
export type AuditedPage = (typeof AUDITED_PAGES)[number];
