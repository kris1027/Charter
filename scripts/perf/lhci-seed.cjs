// LHCI puppeteerScript (spec 0003): runs before every Lighthouse run and seeds a returning visitor.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const { ORIGIN } = require('../../lighthouserc.cjs');
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

module.exports = async (browser, { url }) => {
    const page = await browser.newPage();
    try {
        await page.goto(`${ORIGIN}/`, { waitUntil: 'load' });

        // Leftovers from an earlier run
        await page.evaluate(clearWorkers, 0);
        await page.evaluate((resume) => {
            localStorage.clear();
            localStorage.setItem('resumeData', resume);
            localStorage.setItem('privacyNoticeAccepted', 'true');
            localStorage.setItem('pwaInstallDismissed', 'true');
            localStorage.setItem('language', 'en');
        }, resumeJson);

        // Never audit an empty /preview: its "no data" screen has no export button
        if (new URL(url).pathname === '/preview') {
            await page.goto(url, { waitUntil: 'load' });
            try {
                await page.waitForSelector("[data-testid='export-pdf']", { timeout: 10000 });
            } catch {
                throw new Error(
                    'Seeding failed: /preview did not render the export button within 10 s',
                );
            }
        }

        // Every visit above registers the app's service worker again
        await page.evaluate(clearWorkers, 5000);

        await page.goto('about:blank');
    } finally {
        await page.close();
    }
};
