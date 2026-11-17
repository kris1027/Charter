// pnpm perf:lhci-summary: Lighthouse medians next to their floors, plus a warning per score
// below 0.95 (spec 0003, spec 0014). One row per URL with its query and device. Always exits 0;
// failing on a floor is LHCI's job.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { markdownTable, writeJobSummary } from './job-summary.ts';

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const;
const WARN_BELOW = 0.95;

type Category = (typeof CATEGORIES)[number];
// Each URL holds only the categories it asserts; the rest are reported, not asserted
export type Floors = Record<string, Partial<Record<Category, number>>>;
export type ReportEntry = {
    url: string;
    isRepresentativeRun?: boolean;
    summary: Partial<Record<Category, number>>;
};

const score = (value: number | undefined) => (value === undefined ? 'n/a' : value.toFixed(2));
const floorText = (value: number | undefined) =>
    value === undefined ? 'not asserted' : `floor ${score(value)}`;

// `?viewport=desktop` names the desktop preset runs (lighthouserc.desktop.cjs)
const deviceOf = (query: URLSearchParams) =>
    query.get('viewport') === 'desktop' ? 'desktop' : 'phone';

/** Reads LHCI's report manifest: the representative run per URL holds the median scores. */
export const summarize = (entries: ReportEntry[], floors: Floors) => {
    const warnings: string[] = [];
    const rows = entries
        .filter((entry) => entry.isRepresentativeRun)
        .map((entry) => {
            // With the query, so each variant (`?theme=dark&lang=pl`) gets its own row and floors
            const { pathname, search, searchParams } = new URL(entry.url);
            const path = pathname + search;
            const cells = CATEGORIES.map((category) => {
                const value = entry.summary[category];
                if (value !== undefined && value < WARN_BELOW) {
                    warnings.push(
                        `::warning::Lighthouse ${category} on ${path} is ${score(value)}, below ${WARN_BELOW}`,
                    );
                }
                return `${score(value)} (${floorText(floors[path]?.[category])})`;
            });
            return [`\`${path}\``, deviceOf(searchParams), ...cells];
        });

    const markdown = [
        '### Lighthouse medians',
        '',
        markdownTable(
            [
                { label: 'Page' },
                { label: 'Device' },
                ...CATEGORIES.map((category) => ({ label: category, align: 'right' as const })),
            ],
            rows,
        ),
        '',
    ].join('\n');

    return { markdown, warnings };
};

const writeSummary = (text: string) => {
    writeJobSummary(text);
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
