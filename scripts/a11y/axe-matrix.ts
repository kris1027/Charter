// What the axe scan covers (spec 0014, AC-3, AC-5): every page in every variant on load, plus
// seven overlays opened through their real triggers. Plain data, so a unit test can count it.
import type { Page } from 'puppeteer';
import en from '../../src/locales/en/translation.json' with { type: 'json' };
import pl from '../../src/locales/pl/translation.json' with { type: 'json' };

// Scans running at once, each in its own browser context (AC-7)
export const CONCURRENCY = process.env.CI ? 2 : 4;

// Lighthouse's mobile size and its desktop preset (spec 0014, Value sourcing)
export const VIEWPORTS = {
    phone: { width: 412, height: 823, isMobile: true, hasTouch: true, deviceScaleFactor: 1.75 },
    desktop: { width: 1350, height: 940, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
} as const;

export const LANGS = ['en', 'pl'] as const;
export const THEMES = ['light', 'dark'] as const;
export const VISITORS = ['returning', 'first'] as const;

export type Lang = (typeof LANGS)[number];
export type Theme = (typeof THEMES)[number];
export type Viewport = keyof typeof VIEWPORTS;
export type Visitor = (typeof VISITORS)[number];

export type Variant = { lang: Lang; theme: Theme; viewport: Viewport; visitor: Visitor };

export const PAGES = ['/', '/templates', '/templates/developer', '/builder', '/preview'] as const;
export type PagePath = (typeof PAGES)[number];

export type LoadScan = { kind: 'load'; path: PagePath; variant: Variant };

export type OpenStateScan = {
    kind: 'open';
    path: PagePath;
    name: string;
    variant: Variant;
    /** Finds the trigger by role and accessible name, clicks it, waits for the overlay. */
    open: (page: Page, lang: Lang) => Promise<void>;
};

export type Scan = LoadScan | OpenStateScan;

const TRANSLATIONS = { en, pl };

/** The text a translation key shows in that language, so triggers are found by their real name. */
export const text = (lang: Lang, key: string): string => {
    const value = key
        .split('.')
        .reduce<unknown>(
            (node, part) => (node as Record<string, unknown> | undefined)?.[part],
            TRANSLATIONS[lang],
        );
    if (typeof value !== 'string') throw new Error(`No ${lang} translation for ${key}`);
    return value;
};

export const OVERLAY_TIMEOUT = 15000;

// Puppeteer's ARIA selector: role plus exact accessible name
const byRole = (role: string, name: string) =>
    `::-p-aria([name=${JSON.stringify(name)}][role="${role}"])`;

const clickByRole = async (page: Page, role: string, name: string) => {
    const element = await page.waitForSelector(byRole(role, name), {
        visible: true,
        timeout: OVERLAY_TIMEOUT,
    });
    if (!element) throw new Error(`No ${role} named "${name}"`);
    await element.click();
};

// An overlay counts as open when an element with its role is visible (AC-5)
const waitForRole = (page: Page, role: string) =>
    page.waitForSelector(`[role="${role}"]`, { visible: true, timeout: OVERLAY_TIMEOUT });

type OverlaySpec = {
    path: PagePath;
    name: string;
    viewport: Viewport;
    open: (page: Page, lang: Lang) => Promise<void>;
};

const menu =
    (key: string) =>
    async (page: Page, lang: Lang): Promise<void> => {
        await clickByRole(page, 'button', text(lang, key));
        await waitForRole(page, 'menu');
    };

export const OVERLAYS: OverlaySpec[] = [
    { path: '/', name: 'theme menu', viewport: 'desktop', open: menu('accessibility.toggleTheme') },
    {
        path: '/',
        name: 'language menu',
        viewport: 'desktop',
        open: menu('accessibility.toggleLanguage'),
    },
    {
        path: '/builder',
        name: 'actions menu',
        viewport: 'desktop',
        open: menu('builder.actions.label'),
    },
    {
        path: '/builder',
        name: 'reset dialog',
        viewport: 'desktop',
        open: async (page, lang) => {
            await menu('builder.actions.label')(page, lang);
            await clickByRole(page, 'menuitem', text(lang, 'builder.reset'));
            await waitForRole(page, 'alertdialog');
        },
    },
    {
        path: '/builder',
        name: 'live preview sheet',
        viewport: 'phone',
        open: async (page, lang) => {
            await clickByRole(page, 'button', text(lang, 'builder.livePreview.open'));
            await waitForRole(page, 'dialog');
        },
    },
    {
        path: '/builder',
        name: 'start date picker',
        viewport: 'desktop',
        // The first match is the first experience entry's start date
        open: async (page, lang) => {
            await clickByRole(page, 'button', text(lang, 'form.startDate'));
            await waitForRole(page, 'dialog');
        },
    },
    {
        path: '/builder',
        name: 'language level select',
        viewport: 'desktop',
        // The first match is the first language card's level
        open: async (page, lang) => {
            await clickByRole(page, 'combobox', text(lang, 'form.proficiency'));
            await waitForRole(page, 'listbox');
        },
    },
];

export const loadScans = (): LoadScan[] =>
    PAGES.flatMap((path) =>
        LANGS.flatMap((lang) =>
            THEMES.flatMap((theme) =>
                (Object.keys(VIEWPORTS) as Viewport[]).flatMap((viewport) =>
                    VISITORS.map((visitor) => ({
                        kind: 'load' as const,
                        path,
                        variant: { lang, theme, viewport, visitor },
                    })),
                ),
            ),
        ),
    );

// Open states run as a returning visitor, in every language and theme, at one viewport each
export const openStateScans = (): OpenStateScan[] =>
    OVERLAYS.flatMap(({ path, name, viewport, open }) =>
        LANGS.flatMap((lang) =>
            THEMES.map((theme) => ({
                kind: 'open' as const,
                path,
                name,
                open,
                variant: { lang, theme, viewport, visitor: 'returning' as const },
            })),
        ),
    );

export const allScans = (): Scan[] => [...loadScans(), ...openStateScans()];

export const variantLabel = ({ lang, theme, viewport, visitor }: Variant) =>
    `${lang} ${theme} ${viewport} ${visitor}`;

export const stateLabel = (scan: Scan) => (scan.kind === 'load' ? 'load' : scan.name);

export const scanLabel = (scan: Scan) =>
    `${scan.path} (${variantLabel(scan.variant)}, ${stateLabel(scan)})`;
