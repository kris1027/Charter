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
            '| `/builder` | phone | 0.90 (floor 0.80) | 1.00 (floor 0.90) | 0.96 (floor 0.90) | 1.00 (floor 0.90) |',
        );
    });

    it('should give a run its own row and floors when its URL carries a query', () => {
        const { markdown } = summarize(
            [entry({ url: 'http://localhost:4173/builder?theme=dark' })],
            {
                ...floors,
                '/builder?theme=dark': {
                    performance: 0.7,
                    accessibility: 0.7,
                    'best-practices': 0.7,
                    seo: 0.7,
                },
            },
        );

        expect(markdown).toContain('| `/builder?theme=dark` | phone | 0.90 (floor 0.70) |');
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

    it('should give each URL its own row with its floors when the manifest mixes phone, Polish, dark and desktop', () => {
        const all = { performance: 1, accessibility: 1, 'best-practices': 1, seo: 1 };
        const steady = { accessibility: 0.95, 'best-practices': 0.95, seo: 0.95 };
        const { markdown } = summarize(
            [
                entry({ summary: all }),
                entry({ url: 'http://localhost:4173/builder?lang=pl', summary: all }),
                entry({ url: 'http://localhost:4173/builder?theme=dark&lang=pl', summary: all }),
                entry({ url: 'http://localhost:4173/builder?viewport=desktop', summary: all }),
            ],
            {
                ...floors,
                '/builder?lang=pl': steady,
                '/builder?theme=dark&lang=pl': steady,
                '/builder?viewport=desktop': steady,
            },
        );

        expect(markdown).toContain(
            '| `/builder?lang=pl` | phone | 1.00 (not asserted) | 1.00 (floor 0.95) | 1.00 (floor 0.95) | 1.00 (floor 0.95) |',
        );
        expect(markdown).toContain(
            '| `/builder?theme=dark&lang=pl` | phone | 1.00 (not asserted) |',
        );
        expect(markdown).toContain(
            '| `/builder?viewport=desktop` | desktop | 1.00 (not asserted) | 1.00 (floor 0.95) |',
        );
    });
});
