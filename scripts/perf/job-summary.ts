// GitHub job summary helpers shared by the perf scripts (spec 0003).
import { appendFileSync } from 'node:fs';

export type Column = { label: string; align?: 'right' };

/** Appends to the job summary when running in GitHub Actions; a no-op locally. */
export const writeJobSummary = (text: string) => {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) appendFileSync(summaryPath, text);
};

const tableRow = (cells: string[]) => `| ${cells.join(' | ')} |`;

export const markdownTable = (columns: Column[], rows: string[][]) =>
    [
        tableRow(columns.map((column) => column.label)),
        tableRow(columns.map((column) => (column.align === 'right' ? '---:' : '---'))),
        ...rows.map(tableRow),
    ].join('\n');
