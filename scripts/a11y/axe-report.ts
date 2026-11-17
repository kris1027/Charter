// Turns axe results into the console list, the job summary table and the pass or fail verdict
// (spec 0014, AC-2, AC-6). Pure, so the unit tests feed it hand written results.
import type { AxeResults, ImpactValue, NodeResult, Result } from 'axe-core';
import type { AxeException } from './axe-exceptions.ts';
import { markdownTable } from '../perf/job-summary.ts';
import { LANGS, PAGES, THEMES, scanLabel, stateLabel, variantLabel } from './axe-matrix.ts';
import type { Scan } from './axe-matrix.ts';

export const IMPACTS = ['critical', 'serious', 'moderate', 'minor'] as const;
export type Impact = (typeof IMPACTS)[number];
const FAILING: ReadonlySet<Impact> = new Set(['critical', 'serious']);

export type ScanResult = {
    scan: Scan;
    /** Axe's violations and its undecided checks; absent when the scan never got to run axe */
    axe?: Pick<AxeResults, 'violations' | 'incomplete'>;
    /** A failed wait, a missing trigger or a wrong `<html lang>` */
    error?: string;
};

/** One violating element: a rule on one node, with the scan it came from. */
export type Finding = {
    scan: Scan;
    rule: string;
    impact: Impact;
    selector: string;
    help: string;
    helpUrl: string;
    excepted: boolean;
};

const nodeSelector = (node: NodeResult) => node.target.map(String).join(' ');

const impactOf = (value: ImpactValue | undefined): Impact =>
    value && (IMPACTS as readonly string[]).includes(value) ? (value as Impact) : 'minor';

const isExcepted = (exceptions: AxeException[], scan: Scan, rule: string, selector: string) =>
    exceptions.some(
        (exception) =>
            exception.kind === 'rule' &&
            exception.rule === rule &&
            exception.selector === selector &&
            exception.paths.includes(scan.path),
    );

export const findings = (results: ScanResult[], exceptions: AxeException[]): Finding[] =>
    results.flatMap(({ scan, axe }) =>
        (axe?.violations ?? []).flatMap((violation: Result) =>
            violation.nodes.map((node) => {
                const selector = nodeSelector(node);
                return {
                    scan,
                    rule: violation.id,
                    impact: impactOf(node.impact ?? violation.impact),
                    selector,
                    help: violation.help,
                    helpUrl: violation.helpUrl,
                    excepted: isExcepted(exceptions, scan, violation.id, selector),
                };
            }),
        ),
    );

export const isFailing = (finding: Finding) => !finding.excepted && FAILING.has(finding.impact);

/** The scan fails on any serious or critical finding not excepted, or any scan that errored. */
export const verdict = (results: ScanResult[], exceptions: AxeException[]) => {
    const all = findings(results, exceptions);
    const failing = all.filter(isFailing);
    const errors = results.filter((result) => result.error);
    return { all, failing, errors, passed: failing.length === 0 && errors.length === 0 };
};

export const consoleLines = (results: ScanResult[], exceptions: AxeException[]) => {
    const { all, errors } = verdict(results, exceptions);
    return [
        ...all.map((finding) => {
            const mark = finding.excepted ? 'excepted' : finding.impact;
            return `[${mark}] ${finding.rule} on ${scanLabel(finding.scan)}: ${finding.selector} (${finding.help}) ${finding.helpUrl}`;
        }),
        ...errors.map((result) => `[error] ${scanLabel(result.scan)}: ${result.error}`),
    ];
};

const GROUPS = LANGS.flatMap((lang) => THEMES.map((theme) => ({ lang, theme })));

type Counts = Record<Impact, number> & { excepted: number; incomplete: number; errors: number };

const emptyCounts = (): Counts => ({
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    excepted: 0,
    incomplete: 0,
    errors: 0,
});

const impactCell = (counts: Counts) => IMPACTS.map((impact) => counts[impact]).join(' / ');

/**
 * One row per page and state, a column per language and theme (both viewports and visitors
 * summed), each cell critical / serious / moderate / minor; then excepted, incomplete and
 * errored scans for the whole row.
 */
export const summaryMarkdown = (results: ScanResult[], exceptions: AxeException[]) => {
    const { all, failing, errors, passed } = verdict(results, exceptions);
    const rowKey = (scan: Scan) => `${scan.path}\u0000${stateLabel(scan)}`;
    const groupKey = (scan: Scan) => `${scan.variant.lang} ${scan.variant.theme}`;

    const rows = new Map<string, { scan: Scan; groups: Map<string, Counts>; total: Counts }>();
    const rowFor = (scan: Scan) => {
        const key = rowKey(scan);
        let row = rows.get(key);
        if (!row) {
            row = { scan, groups: new Map(), total: emptyCounts() };
            rows.set(key, row);
        }
        let group = row.groups.get(groupKey(scan));
        if (!group) {
            group = emptyCounts();
            row.groups.set(groupKey(scan), group);
        }
        return { row, group };
    };

    for (const result of results) {
        const { row } = rowFor(result.scan);
        row.total.incomplete += result.axe?.incomplete.length ?? 0;
        if (result.error) row.total.errors += 1;
    }
    for (const finding of all) {
        const { row, group } = rowFor(finding.scan);
        if (finding.excepted) row.total.excepted += 1;
        else group[finding.impact] += 1;
    }

    const pageOrder = (scan: Scan) => PAGES.indexOf(scan.path) * 2 + (scan.kind === 'load' ? 0 : 1);
    const tableRows = [...rows.values()]
        .sort((a, b) => pageOrder(a.scan) - pageOrder(b.scan))
        .map(({ scan, groups, total }) => [
            `\`${scan.path}\``,
            stateLabel(scan),
            ...GROUPS.map(({ lang, theme }) =>
                impactCell(groups.get(`${lang} ${theme}`) ?? emptyCounts()),
            ),
            String(total.excepted),
            String(total.incomplete),
            String(total.errors),
        ]);

    const exceptionLines =
        exceptions.length === 0
            ? ['No exceptions in force.']
            : [
                  'Exceptions in force:',
                  '',
                  ...exceptions.map((exception) =>
                      exception.kind === 'rule'
                          ? `- \`${exception.rule}\` on \`${exception.selector}\` (${exception.paths.join(', ')}): ${exception.reason}`
                          : `- ${exception.state} scans only \`${exception.selector}\` (${exception.paths.join(', ')}): ${exception.reason}`,
                  ),
              ];

    const errorLines = errors.map(
        (result) =>
            `- ${result.scan.path} (${variantLabel(result.scan.variant)}, ${stateLabel(result.scan)}): ${result.error}`,
    );

    return [
        `### Accessibility (axe): ${passed ? 'passed' : 'failed'}`,
        '',
        `${results.length} scans, ${failing.length} serious or critical findings, ${errors.length} errored scans. Cells count critical / serious / moderate / minor, both viewports and visitors summed.`,
        '',
        markdownTable(
            [
                { label: 'Page' },
                { label: 'State' },
                ...GROUPS.map(({ lang, theme }) => ({
                    label: `${lang.toUpperCase()} ${theme}`,
                    align: 'right' as const,
                })),
                { label: 'Excepted', align: 'right' as const },
                { label: 'Incomplete', align: 'right' as const },
                { label: 'Errors', align: 'right' as const },
            ],
            tableRows,
        ),
        '',
        ...(errorLines.length > 0 ? ['Errored scans:', '', ...errorLines, ''] : []),
        ...exceptionLines,
        '',
    ].join('\n');
};
