// @vitest-environment node
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { unmatchedFloors } from './lhci-run.ts';

type LhciConfig = {
    ORIGIN: string;
    floors: Record<string, Record<string, number>>;
    desktopUrls: string[];
    ci: { collect: { url: string[] } };
};
const config = createRequire(import.meta.url)('../../lighthouserc.cjs') as LhciConfig;

describe('unmatchedFloors', () => {
    it('should name a floor when no run audited its URL', () => {
        expect(
            unmatchedFloors(['/', '/builder?lang=pl'], 'http://x', [
                'http://x/',
                'http://x/builder',
            ]),
        ).toEqual(['/builder?lang=pl']);
    });

    it('should leave no floor unmatched when both collects run every configured URL', () => {
        const urls = [...config.ci.collect.url, ...config.desktopUrls];

        expect(unmatchedFloors(Object.keys(config.floors), config.ORIGIN, urls)).toEqual([]);
    });
});

describe('lighthouserc', () => {
    it('should audit 22 URLs in 36 runs when phone and desktop are counted', () => {
        const urls = [...config.ci.collect.url, ...config.desktopUrls];

        expect(new Set(urls).size).toBe(22);
        expect(urls).toHaveLength(36);
        expect(Object.keys(config.floors)).toHaveLength(22);
    });

    it('should keep every floor between 0.95 and 1.00 when the config loads', () => {
        const scores = Object.values(config.floors).flatMap((categories) =>
            Object.values(categories),
        );

        expect(scores.every((score) => score >= 0.95 && score <= 1)).toBe(true);
    });

    it('should assert performance only when the URL is English light and steady enough', () => {
        const withPerformance = Object.entries(config.floors)
            .filter(([, categories]) => 'performance' in categories)
            .map(([path]) => path);

        expect(withPerformance).toEqual([
            '/',
            '/templates',
            '/templates/developer',
            '/builder',
            '/preview',
            '/builder?viewport=desktop',
        ]);
    });
});
