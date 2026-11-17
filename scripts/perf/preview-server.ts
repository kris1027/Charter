// Starts `vite preview` on the built dist for the scripts that audit it (spec 0014): the axe scan
// and both Lighthouse collects, which share one server since LHCI stops its own after a collect.
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { PREVIEW_ORIGIN, PREVIEW_PORT } from './audit-targets.ts';

const ROOT = resolve(import.meta.dirname, '../..');

const waitForServer = async (deadline: number) => {
    while (Date.now() < deadline) {
        try {
            const response = await fetch(`${PREVIEW_ORIGIN}/`);
            if (response.ok) return;
        } catch {
            // Not up yet
        }
        await new Promise((done) => setTimeout(done, 250));
    }
    throw new Error(`vite preview did not answer on ${PREVIEW_ORIGIN} within 30 s`);
};

/** Resolves once the server answers; call the returned stop() in a finally. */
export const startPreviewServer = async () => {
    const server = spawn(
        'pnpm',
        ['exec', 'vite', 'preview', '--port', String(PREVIEW_PORT), '--strictPort'],
        { cwd: ROOT, stdio: 'ignore', detached: process.platform !== 'win32' },
    );
    const stop = () => {
        if (server.pid === undefined || server.exitCode !== null) return;
        try {
            // The whole group: pnpm plus the vite process it started
            if (process.platform === 'win32') server.kill();
            else process.kill(-server.pid, 'SIGTERM');
        } catch {
            // Already gone
        }
    };
    try {
        await waitForServer(Date.now() + 30000);
    } catch (error) {
        stop();
        throw error;
    }
    return stop;
};
