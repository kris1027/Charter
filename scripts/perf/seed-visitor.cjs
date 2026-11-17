// One visitor setup for Lighthouse (lhci-seed.cjs) and the axe scan (scripts/a11y), spec 0014.
// Both checks see the same app state, and the storage keys live only here.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const resumeJson = JSON.stringify(
    JSON.parse(readFileSync(join(__dirname, '../../src/test/fixtures/perf-resume.json'), 'utf8')),
);

// Runs in the page: no service worker or Cache Storage may carry over into the audit.
// The app registers its worker after load, so waitMs gives that registration time to appear.
const clearWorkers = async (waitMs) => {
    const deadline = Date.now() + waitMs;
    let registrations = await navigator.serviceWorker.getRegistrations();
    while (registrations.length === 0 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        registrations = await navigator.serviceWorker.getRegistrations();
    }
    await Promise.all(registrations.map((registration) => registration.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
};

/**
 * Writes the visitor's storage on the page's current origin, in the formats the app writes:
 * `language` a bare `en` or `pl`, `theme` `light` or `dark`. A returning visitor also holds the
 * fixture resume and has dismissed the privacy notice and the install prompt; a first visitor
 * holds only the language and theme, so those show.
 * @param {import('puppeteer').Page} page already on the app's origin
 * @param {{ visitor: 'returning' | 'first', theme: 'light' | 'dark', lang: 'en' | 'pl' }} variant
 */
const seedVisitor = async (page, { visitor, theme, lang }) => {
    await page.evaluate(
        (resume, isReturning, storedTheme, storedLang) => {
            localStorage.clear();
            if (isReturning) {
                localStorage.setItem('resumeData', resume);
                localStorage.setItem('privacyNoticeAccepted', 'true');
                localStorage.setItem('pwaInstallDismissed', 'true');
            }
            localStorage.setItem('language', storedLang);
            localStorage.setItem('theme', storedTheme);
        },
        resumeJson,
        visitor === 'returning',
        theme,
        lang,
    );
};

/**
 * The variant an audited URL names in its query (spec 0014, AC-8). The app keeps these queries
 * in the URL but never reads them; `viewport` only names the URL and is ignored here.
 * @param {string} url
 */
const variantFromUrl = (url) => {
    const query = new URL(url).searchParams;
    return {
        theme: query.get('theme') === 'dark' ? 'dark' : 'light',
        lang: query.get('lang') === 'pl' ? 'pl' : 'en',
    };
};

module.exports = { seedVisitor, clearWorkers, variantFromUrl };
