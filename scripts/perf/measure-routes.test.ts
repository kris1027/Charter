// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { checkBudgets, measureRoutes, routePathFromFile } from './measure-routes.ts';
import type { Budgets, Manifest } from './measure-routes.ts';

const KB = 1024;

// entry → shared; route → shared + routeOnly; route ⇢ (dynamic) lazy
const manifest: Manifest = {
    'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_shared.js'] },
    '_shared.js': { file: 'assets/shared.js' },
    '_route-only.js': { file: 'assets/route-only.js' },
    'src/lazy.ts': { file: 'assets/lazy.js', imports: ['_shared.js'] },
    'src/routes/builder.tsx?tsr-split=component': {
        file: 'assets/builder.js',
        imports: ['_shared.js', '_route-only.js', 'index.html'],
        dynamicImports: ['src/lazy.ts'],
    },
    'index.css': { file: 'assets/index.css' },
};

const sizes: Record<string, number> = {
    'assets/index.js': 10 * KB,
    'assets/shared.js': 20 * KB,
    'assets/route-only.js': 5 * KB,
    'assets/lazy.js': 300 * KB,
    'assets/builder.js': 3 * KB,
    'assets/index.css': 1 * KB,
};
const sizeOf = (file: string) => sizes[file];

const budgets = (overrides: Partial<Budgets> = {}): Budgets => ({
    compression: 'brotli',
    routes: { '/builder': { maxKb: 40, reason: 'test' } },
    chunkCap: { maxKb: 400, reason: 'test' },
    ...overrides,
});

describe('routePathFromFile', () => {
    it('should map index.tsx to /', () => {
        expect(routePathFromFile('index.tsx')).toBe('/');
    });

    it('should map a plain route file to its path', () => {
        expect(routePathFromFile('builder.tsx')).toBe('/builder');
    });

    it('should drop the trailing _ and keep $params when the route is un-nested', () => {
        expect(routePathFromFile('templates_.$templateId.tsx')).toBe('/templates/$templateId');
    });

    it('should return null when the file is __root', () => {
        expect(routePathFromFile('__root.tsx')).toBeNull();
    });

    it.each(['_layout.tsx', 'files.$.tsx', '(group).about.tsx', '-components.tsx'])(
        'should throw when the file name %s does not fit the mapping rules',
        (fileName) => {
            expect(() => routePathFromFile(fileName)).toThrow(fileName);
        },
    );
});

describe('measureRoutes', () => {
    it('should count each static chunk once and skip dynamic imports when summing a route', () => {
        const { routes } = measureRoutes(manifest, sizeOf);

        expect(routes).toHaveLength(1);
        expect(routes[0].path).toBe('/builder');
        expect(routes[0].bytes).toBe((10 + 20 + 5 + 3) * KB);
        expect(routes[0].files).not.toContain('assets/lazy.js');
    });

    it('should list every js chunk, lazy ones included, when measuring chunks', () => {
        const { chunks } = measureRoutes(manifest, sizeOf);

        expect(chunks.map((chunk) => chunk.file)).toContain('assets/lazy.js');
        expect(chunks.map((chunk) => chunk.file)).not.toContain('assets/index.css');
    });

    it('should throw when the manifest has no entry chunk', () => {
        const noEntry = { ...manifest, 'index.html': { file: 'assets/index.js' } };
        expect(() => measureRoutes(noEntry, sizeOf)).toThrow('isEntry');
    });

    it('should throw when an import key is missing from the manifest', () => {
        const broken = {
            ...manifest,
            '_shared.js': { file: 'assets/shared.js', imports: ['_gone.js'] },
        };
        expect(() => measureRoutes(broken, sizeOf)).toThrow('_gone.js');
    });

    it('should throw when a route file does not fit the mapping rules', () => {
        const withLayout = {
            ...manifest,
            'src/routes/_layout.tsx?tsr-split=component': { file: 'assets/layout.js' },
        };
        expect(() => measureRoutes(withLayout, sizeOf)).toThrow('_layout.tsx');
    });
});

describe('checkBudgets', () => {
    const measured = measureRoutes(manifest, sizeOf);

    it('should pass with a row per route plus the largest chunk when all is within budget', () => {
        const result = checkBudgets(measured, budgets());

        expect(result.ok).toBe(true);
        expect(result.problems).toEqual([]);
        expect(result.rows.map((row) => row.label)).toEqual([
            '/builder',
            'largest chunk (assets/lazy.js)',
        ]);
    });

    it('should name the route with its size and budget when it is over budget', () => {
        const result = checkBudgets(
            measured,
            budgets({ routes: { '/builder': { maxKb: 30, reason: 'test' } } }),
        );

        expect(result.ok).toBe(false);
        expect(result.problems).toEqual(['/builder: 38.0 KiB is over its 30 KiB budget']);
    });

    it('should name the chunk when a single chunk is over the cap', () => {
        const result = checkBudgets(
            measured,
            budgets({ chunkCap: { maxKb: 100, reason: 'test' } }),
        );

        expect(result.ok).toBe(false);
        expect(result.problems).toEqual([
            'chunk assets/lazy.js: 300.0 KiB is over the 100 KiB chunk cap',
        ]);
    });

    it('should fail with the path and size when a route has no budget', () => {
        const result = checkBudgets(measured, budgets({ routes: {} }));

        expect(result.ok).toBe(false);
        expect(result.problems).toEqual([
            '/builder: no budget in perf/budgets.json (measured 38.0 KiB)',
        ]);
    });

    it('should fail when a budget matches no route chunk', () => {
        const result = checkBudgets(
            measured,
            budgets({
                routes: {
                    '/builder': { maxKb: 40, reason: 'test' },
                    '/gone': { maxKb: 40, reason: 'test' },
                },
            }),
        );

        expect(result.problems).toEqual(['/gone: budget matches no route chunk (stale budget)']);
    });

    it('should fail when a budget reason is missing or empty', () => {
        const result = checkBudgets(
            measured,
            budgets({
                routes: { '/builder': { maxKb: 40, reason: ' ' } },
                chunkCap: { maxKb: 400 },
            }),
        );

        expect(result.problems).toEqual([
            '/builder: budget has no reason',
            'chunkCap: budget has no reason',
        ]);
    });

    it('should fail when compression is not brotli', () => {
        const result = checkBudgets(measured, budgets({ compression: 'gzip' }));

        expect(result.problems).toEqual(['compression must be "brotli", got "gzip"']);
    });
});
