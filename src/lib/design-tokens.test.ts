/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Read from disk: Vitest blanks CSS imports, even with ?raw
const css = readFileSync(resolve(import.meta.dirname, '../index.css'), 'utf8');

// WCAG 2.2 AA contrast for the design tokens (spec 0004). Keep this list in sync with DESIGN.md.
type Theme = 'light' | 'dark';
type Pair = { fg: string; bg: string; min: number };

const TEXT = 4.5;
const NON_TEXT = 3;

const text = (fg: string, ...bgs: string[]): Pair[] => bgs.map((bg) => ({ fg, bg, min: TEXT }));
const nonText = (fg: string, ...bgs: string[]): Pair[] =>
    bgs.map((bg) => ({ fg, bg, min: NON_TEXT }));

const SEMANTIC = ['destructive', 'success', 'warning', 'info'];
const BRAND = ['brand-from', 'brand-via', 'brand-to'];

const PAIRS: Pair[] = [
    ...text('foreground', 'background'),
    ...text('card-foreground', 'card'),
    ...text('popover-foreground', 'popover'),
    ...text('primary-foreground', 'primary', 'primary-hover'),
    ...text('secondary-foreground', 'secondary', 'secondary-hover'),
    ...text('primary', 'accent', 'secondary', 'muted', 'background', 'card'),
    ...text('muted-foreground', 'accent', 'secondary', 'muted', 'background', 'card'),
    ...text('destructive', 'muted'),
    ...text('accent-foreground', 'accent'),
    ...SEMANTIC.flatMap((name) => text(`${name}-foreground`, name)),
    ...SEMANTIC.flatMap((name) => text(name, 'background', 'card')),
    ...nonText('input', 'background', 'card'),
    ...nonText('ring', 'background', 'card'),
    // Brand stops only ever appear as large decorative text, so the large text ratio applies
    ...BRAND.flatMap((name) => nonText(name, 'background')),
];

const readBlock = (selector: string): Record<string, string> => {
    const start = css.indexOf(`\n${selector} {`);
    if (start === -1) throw new Error(`No ${selector} block in index.css`);
    const body = css.slice(start, css.indexOf('\n}', start));
    const tokens: Record<string, string> = {};
    for (const match of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
        tokens[match[1]] = match[2].trim();
    }
    return tokens;
};

const light = readBlock(':root');
const dark = { ...light, ...readBlock('.dark') };
const themes: Record<Theme, Record<string, string>> = { light, dark };

type Rgb = [number, number, number];

// OKLCH to linear sRGB (Björn Ottosson's OKLab matrices), clipped to the sRGB gamut
const oklchToLinearRgb = (value: string): Rgb => {
    const match = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/);
    if (!match) throw new Error(`Not an opaque oklch() color: ${value}`);
    const [l, c, h] = match.slice(1).map(Number);
    const a = c * Math.cos((h * Math.PI) / 180);
    const b = c * Math.sin((h * Math.PI) / 180);

    const lp = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const mp = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const sp = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

    const rgb: Rgb = [
        4.0767416621 * lp - 3.3077115913 * mp + 0.2309699292 * sp,
        -1.2684380046 * lp + 2.6097574011 * mp - 0.3413193965 * sp,
        -0.0041960863 * lp - 0.7034186147 * mp + 1.707614701 * sp,
    ];
    return rgb.map((channel) => Math.min(1, Math.max(0, channel))) as Rgb;
};

const luminance = (value: string) => {
    const [r, g, b] = oklchToLinearRgb(value);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (fg: string, bg: string) => {
    const [high, low] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
};

const cases = (['light', 'dark'] as const).flatMap((theme) =>
    PAIRS.map((pair) => ({ ...pair, theme, label: `${pair.fg} on ${pair.bg} (${theme})` })),
);

describe('design tokens', () => {
    it('should set color-scheme per theme and define no chart or sidebar tokens when index.css is parsed', () => {
        expect(css).not.toMatch(/--(chart|sidebar)-/);
        expect(css).toMatch(/\n:root \{\n\s+color-scheme: light;/);
        expect(css).toMatch(/\n\.dark \{\n\s+color-scheme: dark;/);
    });

    it('should convert white and black to the WCAG extremes when computing contrast', () => {
        expect(contrast('oklch(1 0 0)', 'oklch(0 0 0)')).toBeCloseTo(21, 1);
    });

    it.each(cases)(
        'should meet the contrast ratio when $label is checked',
        ({ fg, bg, min, theme, label }) => {
            const tokens = themes[theme];
            expect(tokens[fg], `--${fg} is missing`).toBeDefined();
            expect(tokens[bg], `--${bg} is missing`).toBeDefined();
            const ratio = contrast(tokens[fg], tokens[bg]);
            expect(ratio, `${label}: ${ratio.toFixed(2)} is under ${min}`).toBeGreaterThanOrEqual(
                min,
            );
        },
    );
});
