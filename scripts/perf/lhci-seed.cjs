// LHCI puppeteerScript (spec 0003, spec 0014): runs before every Lighthouse run and seeds a
// returning visitor in the theme and language the audited URL's query names.
const { ORIGIN } = require('../../lighthouserc.cjs');
const { seedVisitor, clearWorkers, variantFromUrl } = require('./seed-visitor.cjs');

module.exports = async (browser, { url }) => {
    const page = await browser.newPage();
    try {
        await page.goto(`${ORIGIN}/`, { waitUntil: 'load' });

        // Leftovers from an earlier run
        await page.evaluate(clearWorkers, 0);
        // Theme and language always stored, so the audit never follows the runner's own settings
        await seedVisitor(page, { visitor: 'returning', ...variantFromUrl(url) });

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
