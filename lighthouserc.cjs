// Lighthouse CI config (spec 0003). Floors are each page's first CI median minus 0.02,
// except performance on the two PDF pages, which is minus 0.10 (runner noise; see rationale).
// Raise a floor only together with the baseline table in docs/specs/0003-performance-budgets/rationale.md.
const PORT = 4173;
const ORIGIN = `http://localhost:${PORT}`;

// Scores 0 to 1 per page, from CI run 41433413867 on main (2026-11-02)
const floors = {
    '/': { performance: 0.98, accessibility: 0.98, 'best-practices': 0.98, seo: 0.98 },
    '/templates': { performance: 0.96, accessibility: 0.98, 'best-practices': 0.98, seo: 0.9 },
    '/templates/developer': {
        performance: 0.68,
        accessibility: 0.93,
        'best-practices': 0.98,
        seo: 0.9,
    },
    '/builder': { performance: 0.97, accessibility: 0.9, 'best-practices': 0.94, seo: 0.9 },
    '/preview': { performance: 0.62, accessibility: 0.93, 'best-practices': 0.98, seo: 0.9 },
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// LHCI calls the puppeteerScript once per url entry, not once per run, so each page is
// listed RUNS times with numberOfRuns 1: every run gets a fresh seed, assertions still take the median
const RUNS = 3;

const assertMatrix = Object.entries(floors).map(([path, categories]) => ({
    matchingUrlPattern: `^${escapeRegex(ORIGIN + path)}$`,
    assertions: Object.fromEntries(
        Object.entries(categories).map(([category, minScore]) => [
            `categories:${category}`,
            ['error', { minScore, aggregationMethod: 'median' }],
        ]),
    ),
}));

module.exports = {
    ORIGIN,
    floors,
    ci: {
        collect: {
            url: Object.keys(floors).flatMap((path) => Array(RUNS).fill(ORIGIN + path)),
            numberOfRuns: 1,
            startServerCommand: `pnpm exec vite preview --port ${PORT} --strictPort`,
            // Not 'Local:': on CI Vite colors its output and the color reset sits before the colon
            startServerReadyPattern: 'Local',
            startServerReadyTimeout: 30000,
            puppeteerScript: './scripts/perf/lhci-seed.cjs',
            chromePath: process.env.CHROME_PATH,
            // With a puppeteerScript, LHCI ignores settings.chromeFlags and always runs headless
            puppeteerLaunchOptions: {
                executablePath: process.env.CHROME_PATH,
                args: ['--no-sandbox'],
            },
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
