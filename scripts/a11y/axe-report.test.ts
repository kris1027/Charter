// @vitest-environment node
import type { Result } from 'axe-core';
import { describe, expect, it } from 'vitest';
import { checkExceptions, narrowingFor } from './axe-exceptions.ts';
import type { AxeException } from './axe-exceptions.ts';
import type { LoadScan } from './axe-matrix.ts';
import { consoleLines, summaryMarkdown, verdict } from './axe-report.ts';
import type { ScanResult } from './axe-report.ts';

const scan: LoadScan = {
    kind: 'load',
    path: '/',
    variant: { lang: 'en', theme: 'light', viewport: 'phone', visitor: 'returning' },
};

const violation = (id: string, impact: Result['impact'], target = 'button'): Result => ({
    id,
    impact,
    tags: [],
    description: '',
    help: `${id} help`,
    helpUrl: `https://dequeuniversity.com/rules/axe/4.14/${id}`,
    nodes: [{ target: [target], html: '', impact, any: [], all: [], none: [] }],
});

const result = (violations: Result[], incomplete: Result[] = []): ScanResult => ({
    scan,
    axe: { violations, incomplete },
});

describe('axe report', () => {
    it('should fail when a scan has a serious violation', () => {
        expect(verdict([result([violation('color-contrast', 'serious')])], []).passed).toBe(false);
    });

    it('should pass when every violation is moderate or minor', () => {
        const results = [result([violation('region', 'moderate'), violation('x', 'minor')])];

        expect(verdict(results, []).passed).toBe(true);
    });

    it('should fail when a scan errored before axe ran', () => {
        expect(verdict([{ scan, error: 'h1: timed out' }], []).passed).toBe(false);
    });

    it('should drop a matching violation from the failing set when an exception covers it', () => {
        const exceptions: AxeException[] = [
            { kind: 'rule', rule: 'button-name', selector: '.icon', paths: ['/'], reason: 'r' },
        ];
        const outcome = verdict(
            [result([violation('button-name', 'critical', '.icon')])],
            exceptions,
        );

        expect(outcome.passed).toBe(true);
        expect(outcome.all[0].excepted).toBe(true);
    });

    it('should keep failing when the exception names another page', () => {
        const exceptions: AxeException[] = [
            {
                kind: 'rule',
                rule: 'button-name',
                selector: '.icon',
                paths: ['/builder'],
                reason: 'r',
            },
        ];

        expect(
            verdict([result([violation('button-name', 'critical', '.icon')])], exceptions).passed,
        ).toBe(false);
    });

    it('should print rule, impact, page, variant, state, target and help URL for each violation', () => {
        const [line] = consoleLines([result([violation('button-name', 'critical', '.icon')])], []);

        expect(line).toBe(
            '[critical] button-name on / (en light phone returning, load): .icon (button-name help) https://dequeuniversity.com/rules/axe/4.14/button-name',
        );
    });

    it('should count findings by impact per language and theme when building the table', () => {
        const markdown = summaryMarkdown(
            [
                result(
                    [violation('a', 'serious'), violation('b', 'minor')],
                    [violation('c', 'serious')],
                ),
            ],
            [],
        );

        expect(markdown).toContain('### Accessibility (axe): failed');
        expect(markdown).toContain(
            '| `/` | load | 0 / 1 / 0 / 1 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 | 1 | 0 |',
        );
    });

    it('should list every exception in force when the summary is written', () => {
        const exceptions: AxeException[] = [
            {
                kind: 'narrow',
                state: 'menu',
                selector: '[role="menu"]',
                paths: ['/'],
                reason: 'Radix',
            },
        ];

        expect(summaryMarkdown([result([])], exceptions)).toContain(
            '- menu scans only `[role="menu"]` (/): Radix',
        );
    });
});

describe('axe exceptions', () => {
    it('should throw before scanning when an exception has an empty reason', () => {
        expect(() =>
            checkExceptions([
                { kind: 'rule', rule: 'region', selector: 'div', paths: ['/'], reason: ' ' },
            ]),
        ).toThrow('Axe exceptions need a reason: region on div');
    });

    it('should find the narrowing for an open state only on its own page', () => {
        const exceptions: AxeException[] = [
            {
                kind: 'narrow',
                state: 'select',
                selector: '[role="listbox"]',
                paths: ['/builder'],
                reason: 'r',
            },
        ];

        expect(narrowingFor(exceptions, '/builder', 'select')?.selector).toBe('[role="listbox"]');
        expect(narrowingFor(exceptions, '/', 'select')).toBeUndefined();
    });
});
