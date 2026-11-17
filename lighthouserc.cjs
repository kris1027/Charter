// Lighthouse CI config (spec 0003, widened by spec 0014): 20 phone URLs here, plus the 2 desktop
// URLs in lighthouserc.desktop.cjs, all asserted from the one `floors` map below.
// Floors (spec 0014, AC-10): each URL and category's median from the first green CI run after the
// fix pass, minus 0.02 (performance minus 0.05), clamped to [0.95, 1.00]. Change one only together
// with the baseline in docs/specs/0014-accessibility-lighthouse-pass/rationale.md.
const { PREVIEW_ORIGIN: ORIGIN, AUDITED_PAGES: PAGES } = require('./scripts/perf/audit-targets.ts');

// The variant travels in the audited URL's query: the seed script reads it and stores the theme
// and language, and the app itself ignores it. A query, not a hash, since LHCI groups runs by the
// document URL, which drops the hash. EN light is the bare path; `viewport` only names the
// desktop URLs apart
const VARIANT_QUERIES = ['?theme=dark', '?lang=pl', '?theme=dark&lang=pl'];
const DESKTOP_QUERY = '?viewport=desktop';
const DESKTOP_PAGES = ['/templates/developer', '/builder'];

// Accessibility, best practices and SEO give the same score every run on one build, so the
// variants run once and assert only those; performance is noisy and gated on EN light (AC-8)
const ALL = ['performance', 'accessibility', 'best-practices', 'seo'];
const STEADY = ['accessibility', 'best-practices', 'seo'];
const PROVISIONAL = 0.95;
const at = (categories, score) =>
    Object.fromEntries(categories.map((category) => [category, score]));

// LHCI calls the puppeteerScript once per url entry, not once per run, so a URL is listed as
// often as it should run, with numberOfRuns 1: every run gets a fresh seed, asserts take the median
const RUNS = 3;

/** @type {Record<string, Partial<Record<'performance' | 'accessibility' | 'best-practices' | 'seo', number>>>} */
const floors = {
    ...Object.fromEntries(PAGES.map((path) => [path, at(ALL, PROVISIONAL)])),
    ...Object.fromEntries(
        PAGES.flatMap((path) =>
            VARIANT_QUERIES.map((query) => [path + query, at(STEADY, PROVISIONAL)]),
        ),
    ),
    // Desktop performance is reported, not asserted, until three CI runs of it exist (AC-10)
    ...Object.fromEntries(
        DESKTOP_PAGES.map((path) => [path + DESKTOP_QUERY, at(STEADY, PROVISIONAL)]),
    ),
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const assertMatrix = Object.entries(floors).map(([path, categories]) => ({
    matchingUrlPattern: `^${escapeRegex(ORIGIN + path)}$`,
    assertions: Object.fromEntries(
        Object.entries(categories).map(([category, minScore]) => [
            `categories:${category}`,
            ['error', { minScore, aggregationMethod: 'median' }],
        ]),
    ),
}));

const runsOf = (paths, runs) => paths.flatMap((path) => Array(runs).fill(ORIGIN + path));

// Shared by both collects; `pnpm perf:lhci` serves dist once for both (scripts/perf/lhci-run.ts)
const collectBase = {
    numberOfRuns: 1,
    puppeteerScript: './scripts/perf/lhci-seed.cjs',
    chromePath: process.env.CHROME_PATH,
    // With a puppeteerScript, LHCI ignores settings.chromeFlags and always runs headless
    puppeteerLaunchOptions: {
        executablePath: process.env.CHROME_PATH,
        args: ['--no-sandbox'],
    },
};

module.exports = {
    ORIGIN,
    floors,
    collectBase,
    desktopUrls: runsOf(
        DESKTOP_PAGES.map((path) => path + DESKTOP_QUERY),
        RUNS,
    ),
    ci: {
        collect: {
            ...collectBase,
            url: [
                ...runsOf(PAGES, RUNS),
                ...runsOf(
                    PAGES.flatMap((path) => VARIANT_QUERIES.map((query) => path + query)),
                    1,
                ),
            ],
            settings: {
                // Otherwise Lighthouse wipes the storage the seed script wrote
                disableStorageReset: true,
            },
        },
        assert: { assertMatrix },
        upload: {
            target: 'filesystem',
            outputDir: '.lighthouseci/reports',
        },
    },
};
