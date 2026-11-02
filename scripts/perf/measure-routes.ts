// Per route initial JS from Vite's build manifest, checked against perf/budgets.json (spec 0003).

export type ManifestChunk = {
    file: string;
    isEntry?: boolean;
    imports?: string[];
    dynamicImports?: string[];
};

export type Manifest = Record<string, ManifestChunk>;

export type MeasuredRoute = { path: string; files: string[]; bytes: number };
export type MeasuredChunk = { file: string; bytes: number };
export type Measured = { routes: MeasuredRoute[]; chunks: MeasuredChunk[] };

export type Budget = { maxKb: number; reason?: string };
export type Budgets = {
    compression: string;
    routes: Record<string, Budget>;
    chunkCap: Budget;
};

export type BudgetRow = { label: string; kb: number; maxKb: number | null; ok: boolean };
export type BudgetResult = { ok: boolean; rows: BudgetRow[]; problems: string[] };

const ROUTE_PREFIX = 'src/routes/';
const ROUTE_SUFFIX = '?tsr-split=component';
// A plain segment, optionally a $param, optionally with the trailing _ that un-nests a route
const SEGMENT = /^\$?[A-Za-z0-9][A-Za-z0-9-]*_?$/;

export const toKb = (bytes: number) => bytes / 1024;
export const formatKb = (bytes: number) => toKb(bytes).toFixed(1);

/**
 * Maps a TanStack file route name to its URL path: `index` becomes `/`, `.` becomes `/`,
 * a trailing `_` on a segment is dropped, `$name` stays. Returns null for `__root`, which
 * the entry closure already covers. Anything else throws so a new route style forces a rule update.
 */
export const routePathFromFile = (fileName: string): string | null => {
    const name = fileName.replace(/\.tsx?$/, '');
    if (name === '__root') return null;

    const segments = name.split('.');
    const parts = segments.map((segment, index) => {
        if (segment === 'index' && index === segments.length - 1) return '';
        if (!SEGMENT.test(segment)) {
            throw new Error(
                `Route file "${fileName}" doesn't fit the path mapping rules in scripts/perf/measure-routes.ts`,
            );
        }
        return segment.replace(/_$/, '');
    });
    return `/${parts.join('/')}`;
};

const staticClosure = (manifest: Manifest, startKeys: string[]) => {
    const seen = new Set<string>();
    const queue = [...startKeys];
    while (queue.length > 0) {
        const key = queue.shift() as string;
        if (seen.has(key)) continue;
        const chunk = manifest[key];
        if (!chunk) throw new Error(`Manifest has no entry for imported key "${key}"`);
        seen.add(key);
        queue.push(...(chunk.imports ?? []));
    }
    return [...seen].map((key) => manifest[key].file);
};

/**
 * A route's initial JS is the entry chunk plus its `?tsr-split=component` chunk plus every
 * chunk reachable from those two through static imports, each counted once.
 */
export const measureRoutes = (manifest: Manifest, sizeOf: (file: string) => number): Measured => {
    const entries = Object.keys(manifest).filter((key) => manifest[key].isEntry);
    if (entries.length !== 1) {
        throw new Error(
            `Expected exactly one isEntry chunk in the manifest, found ${entries.length}`,
        );
    }

    const sizes = new Map<string, number>();
    const cachedSize = (file: string) => {
        if (!sizes.has(file)) sizes.set(file, sizeOf(file));
        return sizes.get(file) as number;
    };

    const routes: MeasuredRoute[] = [];
    for (const key of Object.keys(manifest)) {
        if (!key.startsWith(ROUTE_PREFIX) || !key.endsWith(ROUTE_SUFFIX)) continue;
        const path = routePathFromFile(key.slice(ROUTE_PREFIX.length, -ROUTE_SUFFIX.length));
        if (path === null) continue;
        const files = staticClosure(manifest, [entries[0], key]);
        const bytes = files.reduce((sum, file) => sum + cachedSize(file), 0);
        routes.push({ path, files, bytes });
    }

    const jsFiles = new Set(
        Object.values(manifest)
            .map((chunk) => chunk.file)
            .filter((file) => file.endsWith('.js')),
    );
    const chunks = [...jsFiles].map((file) => ({ file, bytes: cachedSize(file) }));

    routes.sort((a, b) => a.path.localeCompare(b.path));
    return { routes, chunks };
};

const hasReason = (budget: Budget) =>
    typeof budget.reason === 'string' && budget.reason.trim() !== '';
const validMax = (budget: Budget) => typeof budget.maxKb === 'number' && budget.maxKb > 0;

export const checkBudgets = (measured: Measured, budgets: Budgets): BudgetResult => {
    const problems: string[] = [];
    const rows: BudgetRow[] = [];

    if (budgets.compression !== 'brotli') {
        problems.push(`compression must be "brotli", got "${budgets.compression}"`);
    }

    for (const route of measured.routes) {
        const budget = budgets.routes[route.path];
        const kb = toKb(route.bytes);
        if (!budget) {
            problems.push(
                `${route.path}: no budget in perf/budgets.json (measured ${formatKb(route.bytes)} KiB)`,
            );
            rows.push({ label: route.path, kb, maxKb: null, ok: false });
            continue;
        }
        const ok = validMax(budget) && kb <= budget.maxKb;
        if (!validMax(budget)) problems.push(`${route.path}: maxKb must be a positive number`);
        else if (!ok) {
            problems.push(
                `${route.path}: ${formatKb(route.bytes)} KiB is over its ${budget.maxKb} KiB budget`,
            );
        }
        rows.push({ label: route.path, kb, maxKb: budget.maxKb, ok });
    }

    const measuredPaths = new Set(measured.routes.map((route) => route.path));
    for (const [path, budget] of Object.entries(budgets.routes)) {
        if (!measuredPaths.has(path)) {
            problems.push(`${path}: budget matches no route chunk (stale budget)`);
        }
        if (!hasReason(budget)) problems.push(`${path}: budget has no reason`);
    }

    const cap = budgets.chunkCap;
    if (!validMax(cap)) problems.push('chunkCap: maxKb must be a positive number');
    if (!hasReason(cap)) problems.push('chunkCap: budget has no reason');

    const largest = measured.chunks.reduce<MeasuredChunk | null>(
        (max, chunk) => (max && max.bytes >= chunk.bytes ? max : chunk),
        null,
    );
    const overCap = measured.chunks.filter((chunk) => toKb(chunk.bytes) > cap.maxKb);
    for (const chunk of overCap) {
        problems.push(
            `chunk ${chunk.file}: ${formatKb(chunk.bytes)} KiB is over the ${cap.maxKb} KiB chunk cap`,
        );
    }
    if (largest) {
        rows.push({
            label: `largest chunk (${largest.file})`,
            kb: toKb(largest.bytes),
            maxKb: cap.maxKb,
            ok: overCap.length === 0 && validMax(cap),
        });
    }

    return { ok: problems.length === 0, rows, problems };
};
