/// <reference lib="dom" />
// pnpm a11y:scan (spec 0014): serves the built dist with vite preview, scans every page and
// overlay in the matrix with axe, and fails on any serious or critical violation (AC-1 to AC-7).
// Set A11Y_FILTER to a text the scan's label contains (such as `/builder` or `pl dark`) to run
// a subset while fixing; CI always runs everything.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { AxePuppeteer } from '@axe-core/puppeteer';
import axe from 'axe-core';
import type { AxeResults } from 'axe-core';
import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';
import { writeJobSummary } from '../perf/job-summary.ts';
import { PREVIEW_ORIGIN as ORIGIN } from '../perf/audit-targets.ts';
import { startPreviewServer } from '../perf/preview-server.ts';
import { runMain } from '../perf/run-main.ts';
import { AXE_EXCEPTIONS, checkExceptions, narrowingFor } from './axe-exceptions.ts';
import {
    CONCURRENCY,
    OVERLAY_TIMEOUT,
    VIEWPORTS,
    allScans,
    scanLabel,
    stateLabel,
} from './axe-matrix.ts';
import type { Scan, Variant } from './axe-matrix.ts';
import { consoleLines, summaryMarkdown, verdict } from './axe-report.ts';
import type { ScanResult } from './axe-report.ts';

const ROOT = resolve(import.meta.dirname, '../..');
const OUT_DIR = join(ROOT, '.a11y');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const WAIT_TIMEOUT = 15000;

type SeedVariant = Pick<Variant, 'visitor' | 'theme' | 'lang'>;
const { seedVisitor } = createRequire(import.meta.url)('../perf/seed-visitor.cjs') as {
    seedVisitor: (page: Page, variant: SeedVariant) => Promise<void>;
};

/** Runs a wait, and once more when it times out; a second failure names what it waited for. */
const withRetry = async (what: string, wait: () => Promise<unknown>) => {
    try {
        await wait();
    } catch {
        try {
            await wait();
        } catch (error) {
            throw new Error(`${what}: ${error instanceof Error ? error.message : String(error)}`, {
                cause: error,
            });
        }
    }
};

// Animations that end (never spinners) finish first, so nothing is scanned mid fade
const settleAnimations = (page: Page) =>
    page.evaluate(() =>
        Promise.race([
            Promise.all(
                document
                    .getAnimations()
                    .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
                    .map((animation) => animation.finished.catch(() => undefined)),
            ),
            new Promise((done) => setTimeout(done, 3000)),
        ]),
    );

const waitForReady = async (page: Page, scan: Scan) => {
    const { path, variant } = scan;
    const visible = (selector: string) =>
        page.waitForSelector(selector, { visible: true, timeout: WAIT_TIMEOUT });

    await withRetry('page load', () =>
        page.goto(ORIGIN + path, { waitUntil: 'load', timeout: WAIT_TIMEOUT }),
    );
    await withRetry('network idle', () =>
        page.waitForNetworkIdle({ idleTime: 500, timeout: WAIT_TIMEOUT }),
    );
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await withRetry('the h1', () => visible('h1'));
    if (path === '/builder') {
        await withRetry('the first form section', () => visible('#section-personalInfo'));
    }
    if (path === '/preview' && variant.visitor === 'returning') {
        await withRetry('the export button', () => visible("[data-testid='export-pdf']"));
    }
    if (path === '/templates/developer' && variant.viewport === 'desktop') {
        // The PDF viewer mounted, or, when it never shows, the prebuilt image still there (spec 0011)
        try {
            await visible('iframe:not(.opacity-0)');
        } catch {
            await withRetry('the PDF viewer or the prebuilt image', () => visible('img'));
        }
    }
    await settleAnimations(page);

    // A seed that did not take shows up here, not as a pass in the wrong language
    const lang = await page.evaluate(() => document.documentElement.lang);
    if (lang !== variant.lang) {
        throw new Error(`<html lang> is "${lang}", expected "${variant.lang}"`);
    }
};

const runScan = async (browser: Browser, scan: Scan): Promise<ScanResult> => {
    // A fresh context per scan: no storage, service worker or cache carries over (AC-4)
    const context = await browser.createBrowserContext();
    try {
        const page = await context.newPage();
        await page.setViewport(VIEWPORTS[scan.variant.viewport]);
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

        // Storage is written on the origin before the page itself opens
        await page.goto(`${ORIGIN}/robots.txt`, { waitUntil: 'load', timeout: WAIT_TIMEOUT });
        await seedVisitor(page, scan.variant);

        await waitForReady(page, scan);
        if (scan.kind === 'open') {
            await withRetry(`opening the ${scan.name}`, () =>
                Promise.race([
                    scan.open(page, scan.variant.lang),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('timed out')), OVERLAY_TIMEOUT + 1000),
                    ),
                ]),
            );
            await settleAnimations(page);
        }

        const scanner = new AxePuppeteer(page, axe.source).withTags(TAGS);
        const narrowing =
            scan.kind === 'open' ? narrowingFor(AXE_EXCEPTIONS, scan.path, scan.name) : undefined;
        if (narrowing) scanner.include(narrowing.selector);
        const results = await scanner.analyze();
        return { scan, axe: results };
    } catch (error) {
        return { scan, error: error instanceof Error ? error.message : String(error) };
    } finally {
        await context.close();
    }
};

const runAll = async (browser: Browser, scans: Scan[]) => {
    const results: ScanResult[] = new Array(scans.length);
    let next = 0;
    let done = 0;
    const worker = async () => {
        while (next < scans.length) {
            const index = next++;
            results[index] = await runScan(browser, scans[index]);
            done += 1;
            const result = results[index];
            const status = result.error ? 'error' : `${result.axe?.violations.length} rules`;
            console.log(`  ${done}/${scans.length} ${scanLabel(scans[index])}: ${status}`);
        }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    return results;
};

// The JSON keeps every violation and undecided check; passing and inapplicable rules keep only
// their ids, since their node lists would make the file hundreds of megabytes
const reportJson = (results: ScanResult[]) =>
    results.map(({ scan, axe: result, error }) => ({
        path: scan.path,
        state: stateLabel(scan),
        variant: scan.variant,
        error,
        axe: result && {
            ...(result as AxeResults),
            passes: (result as AxeResults).passes?.map((rule) => rule.id),
            inapplicable: (result as AxeResults).inapplicable?.map((rule) => rule.id),
        },
    }));

const main = async () => {
    // An exception without a reason fails before anything runs (AC-2)
    checkExceptions(AXE_EXCEPTIONS);
    if (!existsSync(join(ROOT, 'dist/index.html'))) {
        throw new Error('No dist/ build; run `pnpm a11y` or `pnpm build` first.');
    }

    const filter = process.env.A11Y_FILTER;
    const scans = allScans().filter((scan) => !filter || scanLabel(scan).includes(filter));
    console.log(`Axe: ${scans.length} scans, ${CONCURRENCY} at a time`);

    const stopServer = await startPreviewServer();
    let browser: Browser | undefined;
    try {
        browser = await puppeteer.launch({
            executablePath: process.env.CHROME_PATH || undefined,
            args: ['--no-sandbox'],
        });
        const results = await runAll(browser, scans);

        mkdirSync(OUT_DIR, { recursive: true });
        writeFileSync(
            join(OUT_DIR, 'axe-results.json'),
            `${JSON.stringify(reportJson(results), null, 2)}\n`,
        );

        const lines = consoleLines(results, AXE_EXCEPTIONS);
        if (lines.length > 0) console.log(`\n${lines.join('\n')}`);
        const markdown = summaryMarkdown(results, AXE_EXCEPTIONS);
        writeJobSummary(markdown);
        console.log(`\n${markdown}`);
        console.log(`Full results: ${join(OUT_DIR, 'axe-results.json')}`);

        return verdict(results, AXE_EXCEPTIONS).passed ? 0 : 1;
    } finally {
        await browser?.close();
        stopServer();
    }
};

if (import.meta.main) void runMain(main);
