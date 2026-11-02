// pnpm perf:size: fails when a route's initial JS or any single chunk is over budget (spec 0003).
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { brotliCompressSync } from 'node:zlib';
import { checkBudgets, measureRoutes } from './measure-routes.ts';
import type { BudgetResult, Budgets, Manifest } from './measure-routes.ts';

const root = resolve(import.meta.dirname, '../..');
const distDir = join(root, 'dist');
const manifestPath = join(distDir, '.vite/manifest.json');
const budgetsPath = join(root, 'perf/budgets.json');

const readJson = <T>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T;
const sizeOf = (file: string) => brotliCompressSync(readFileSync(join(distDir, file))).length;

const formatMax = (maxKb: number | null) => (maxKb === null ? 'none' : `${maxKb}`);

const printTable = ({ rows, problems }: BudgetResult) => {
    const width = Math.max(...rows.map((row) => row.label.length));
    console.log(`${'Route'.padEnd(width)}  ${'KiB'.padStart(7)}  ${'Budget'.padStart(7)}`);
    for (const row of rows) {
        const mark = row.ok ? 'ok' : 'OVER';
        console.log(
            `${row.label.padEnd(width)}  ${row.kb.toFixed(1).padStart(7)}  ${formatMax(row.maxKb).padStart(7)}  ${mark}`,
        );
    }
    for (const problem of problems) console.error(`✗ ${problem}`);
};

const markdown = ({ ok, rows, problems }: BudgetResult) =>
    [
        `### JS size budgets (brotli) ${ok ? 'passed' : 'failed'}`,
        '',
        '| Route | KiB | Budget | |',
        '| --- | ---: | ---: | --- |',
        ...rows.map(
            (row) =>
                `| \`${row.label}\` | ${row.kb.toFixed(1)} | ${formatMax(row.maxKb)} | ${row.ok ? '✅' : '❌'} |`,
        ),
        ...(problems.length > 0 ? ['', ...problems.map((problem) => `- ${problem}`)] : []),
        '',
    ].join('\n');

// Written before exit in both the passing and the failing case
const writeSummary = (text: string) => {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) appendFileSync(summaryPath, text);
};

const fail = (message: string) => {
    console.error(message);
    writeSummary(`### JS size budgets failed\n\n${message}\n`);
    process.exit(1);
};

if (!existsSync(manifestPath)) {
    fail(`No build manifest at ${manifestPath}. Run pnpm build first.`);
}

try {
    const measured = measureRoutes(readJson<Manifest>(manifestPath), sizeOf);
    const result = checkBudgets(measured, readJson<Budgets>(budgetsPath));
    printTable(result);
    writeSummary(markdown(result));
    process.exitCode = result.ok ? 0 : 1;
} catch (error) {
    fail(error instanceof Error ? error.message : String(error));
}
