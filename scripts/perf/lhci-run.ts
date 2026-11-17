// pnpm perf:lhci (spec 0014, AC-9): phone collect, desktop collect (--additive), assert, upload.
// LHCI stops a server it started after each collect, so this serves dist once for both. LHCI's
// assert skips an assertMatrix entry that matches no run, so a floor whose URL never ran fails here.
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { startPreviewServer } from './preview-server.ts';
import { runMain } from './run-main.ts';

const ROOT = resolve(import.meta.dirname, '../..');
const PHONE_CONFIG = './lighthouserc.cjs';
const DESKTOP_CONFIG = './lighthouserc.desktop.cjs';

/** Floors keys (path plus query) that no collected run audited. */
export const unmatchedFloors = (floorPaths: string[], origin: string, auditedUrls: string[]) => {
    const audited = new Set(auditedUrls);
    return floorPaths.filter((path) => !audited.has(origin + path));
};

const lhci = (...args: string[]) =>
    spawnSync('pnpm', ['exec', 'lhci', ...args], { cwd: ROOT, stdio: 'inherit' }).status ?? 1;

// The collected runs, as `lhci assert` matches them (its pattern tests the LHR's finalUrl)
const auditedUrls = () => {
    const dir = join(ROOT, '.lighthouseci');
    return readdirSync(dir)
        .filter((name) => name.startsWith('lhr-') && name.endsWith('.json'))
        .map(
            (name) =>
                (JSON.parse(readFileSync(join(dir, name), 'utf8')) as { finalUrl: string })
                    .finalUrl,
        );
};

const main = async () => {
    const stopServer = await startPreviewServer();
    try {
        if (lhci('collect', `--config=${PHONE_CONFIG}`) !== 0) return 1;
        if (lhci('collect', '--additive', `--config=${DESKTOP_CONFIG}`) !== 0) return 1;
    } finally {
        stopServer();
    }

    const { ORIGIN, floors } = createRequire(import.meta.url)(join(ROOT, 'lighthouserc.cjs')) as {
        ORIGIN: string;
        floors: Record<string, unknown>;
    };
    const missing = unmatchedFloors(Object.keys(floors), ORIGIN, auditedUrls());
    for (const path of missing)
        console.error(`No Lighthouse run audited ${path}, which has floors`);

    const assertStatus = lhci('assert', `--config=${PHONE_CONFIG}`);
    // Reports are written even when an assertion fails, for the summary and the artifact
    const uploadStatus = lhci('upload', `--config=${PHONE_CONFIG}`);
    return missing.length > 0 || assertStatus !== 0 || uploadStatus !== 0 ? 1 : 0;
};

if (import.meta.main) void runMain(main);
