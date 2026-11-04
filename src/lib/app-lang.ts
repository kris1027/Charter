export const APP_LANGS = ['en', 'pl'] as const;

export type AppLang = (typeof APP_LANGS)[number];

export const normalizeLang = (lang: string | undefined): AppLang =>
    lang?.startsWith('pl') ? 'pl' : 'en';
