// pnpm perf:lhci-summary: Lighthouse medians next to their floors, plus a warning per score
// below 0.95 (spec 0003). Always exits 0; failing on a floor is LHCI's job.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

export const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const;
export const WARN_BELOW = 0.95;

type Category = (typeof CATEGORIES)[number];
export type Floors = Record<string, Record<Category, number>>;
export type ReportEntry = {
    url: string;
    isRepresentativeRun?: boolean;
    summary: Partial<Record<Category, number>>;
};

const score = (value: number | undefined) => (value === undefined ? 'n/a' : value.toFixed(2));

/** Reads LHCI's report manifest: the representative run per URL holds the median scores. */
export const summarize = (entries: ReportEntry[], floors: Floors) => {
    const warnings: string[] = [];
    const rows = entries
        .filter((entry) => entry.isRepresentativeRun)
        .map((entry) => {
            const path = new URL(entry.url).pathname;
            const cells = CATEGORIES.map((category) => {
                const value = entry.summary[category];
                if (value !== undefined && value < WARN_BELOW) {
                    warnings.push(
                        `::warning::Lighthouse ${category} on ${path} is ${score(value)}, below ${WARN_BELOW}`,
                    );
                }
                return `${score(value)} (floor ${score(floors[path]?.[category])})`;
            });
            return `| \`${path}\` | ${cells.join(' | ')} |`;
        });

    const markdown = [
        '### Lighthouse medians',
        '',
        `| Page | ${CATEGORIES.join(' | ')} |`,
        `| --- |${' ---: |'.repeat(CATEGORIES.length)}`,
        ...rows,
        '',
    ].join('\n');

    return { markdown, warnings };
};

const writeSummary = (text: string) => {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) appendFileSync(summaryPath, text);
    console.log(text);
};

if (import.meta.main) {
    const root = resolve(import.meta.dirname, '../..');
    const manifestPath = join(root, '.lighthouseci/reports/manifest.json');

    if (!existsSync(manifestPath)) {
        writeSummary(
            `### Lighthouse medians\n\nNo report at ${manifestPath}; see the LHCI step.\n`,
        );
    } else {
        const { floors } = createRequire(import.meta.url)(join(root, 'lighthouserc.cjs')) as {
            floors: Floors;
        };
        const entries = JSON.parse(readFileSync(manifestPath, 'utf8')) as ReportEntry[];
        const { markdown, warnings } = summarize(entries, floors);
        writeSummary(markdown);
        for (const warning of warnings) console.log(warning);
    }
}
