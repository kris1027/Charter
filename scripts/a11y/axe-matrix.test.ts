// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { allScans, loadScans, openStateScans, scanLabel, text } from './axe-matrix.ts';

describe('axe matrix', () => {
    it('should hold 80 load scans when every page meets every variant', () => {
        expect(loadScans()).toHaveLength(80);
    });

    it('should hold 28 open state scans when seven overlays run in four variants', () => {
        const scans = openStateScans();

        expect(scans).toHaveLength(28);
        expect(scans.every((scan) => scan.variant.visitor === 'returning')).toBe(true);
    });

    it('should name every scan once when the matrix is complete', () => {
        const labels = allScans().map(scanLabel);

        expect(new Set(labels).size).toBe(labels.length);
        expect(labels).toHaveLength(108);
    });

    it('should open the live preview sheet on a phone when the overlay needs a narrow screen', () => {
        const sheet = openStateScans().filter((scan) => scan.name === 'live preview sheet');

        expect(sheet.map((scan) => scan.variant.viewport)).toEqual(Array(4).fill('phone'));
    });

    it('should find a trigger by its Polish name when the variant is Polish', () => {
        expect(text('pl', 'accessibility.toggleTheme')).toBe('Zmień motyw');
    });

    it('should throw when a translation key is missing', () => {
        expect(() => text('en', 'accessibility.nope')).toThrow('No en translation');
    });
});
