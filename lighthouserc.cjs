// Lighthouse CI config (spec 0003). Floors are each page's first CI median minus 0.02.
// Raise a floor only together with the baseline table in docs/specs/0003-performance-budgets/rationale.md.
const PORT = 4173;
const ORIGIN = `http://localhost:${PORT}`;

// Scores 0 to 1 per page; 0 means report only until build task 4 locks the floors
const reportOnly = { performance: 0, accessibility: 0, 'best-practices': 0, seo: 0 };
const floors = {
    '/': reportOnly,
    '/templates': reportOnly,
    '/templates/developer': reportOnly,
    '/builder': reportOnly,
    '/preview': reportOnly,
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
            startServerReadyPattern: 'Local:',
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
