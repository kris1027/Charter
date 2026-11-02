// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { summarize } from './lighthouse-summary.ts';
import type { Floors, ReportEntry } from './lighthouse-summary.ts';

const floors: Floors = {
    '/builder': { performance: 0.8, accessibility: 0.9, 'best-practices': 0.9, seo: 0.9 },
};

const entry = (overrides: Partial<ReportEntry> = {}): ReportEntry => ({
    url: 'http://localhost:4173/builder',
    isRepresentativeRun: true,
    summary: { performance: 0.9, accessibility: 1, 'best-practices': 0.96, seo: 1 },
    ...overrides,
});

describe('summarize', () => {
    it('should print one warning line when one median is below 0.95', () => {
        const { warnings } = summarize([entry()], floors);

        expect(warnings).toEqual([
            '::warning::Lighthouse performance on /builder is 0.90, below 0.95',
        ]);
    });

    it('should show each median next to its floor when building the table', () => {
        const { markdown } = summarize([entry()], floors);

        expect(markdown).toContain(
            '| `/builder` | 0.90 (floor 0.80) | 1.00 (floor 0.90) | 0.96 (floor 0.90) | 1.00 (floor 0.90) |',
        );
    });

    it('should use only the representative run when a page has several runs', () => {
        const { warnings, markdown } = summarize(
            [
                entry({ isRepresentativeRun: false, summary: { performance: 0.5 } }),
                entry({
                    summary: { performance: 1, accessibility: 1, 'best-practices': 1, seo: 1 },
                }),
            ],
            floors,
        );

        expect(warnings).toEqual([]);
        expect(markdown).not.toContain('0.50');
    });
});
