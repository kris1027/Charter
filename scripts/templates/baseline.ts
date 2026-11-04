import { readFileSync } from 'node:fs';

// What the pixel diff compares besides pixels: text, links and the PDF info fields (spec 0006, AC-3).
export type RenderSnapshot = {
    pages: number;
    lines: string[];
    links: string[];
    info: Record<string, unknown>;
};

export const readBaselineJson = (path: string): RenderSnapshot | null => {
    try {
        return JSON.parse(readFileSync(path, 'utf8')) as RenderSnapshot;
    } catch {
        return null;
    }
};

const firstDifference = (a: readonly unknown[], b: readonly unknown[]) => {
    const length = Math.max(a.length, b.length);
    for (let i = 0; i < length; i++) {
        if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return i;
    }
    return -1;
};

// Returns the first differing key with both values, or null when the snapshots match.
export const compareBaseline = (
    baseline: RenderSnapshot | null,
    current: RenderSnapshot,
): string | null => {
    if (!baseline) return 'no baseline file';
    if (baseline.pages !== current.pages) {
        return `pages ${baseline.pages} -> ${current.pages}`;
    }
    for (const key of ['lines', 'links'] as const) {
        const index = firstDifference(baseline[key], current[key]);
        if (index >= 0) {
            return `${key}[${index}] ${JSON.stringify(baseline[key][index])} -> ${JSON.stringify(current[key][index])}`;
        }
    }
    const infoKeys = [...new Set([...Object.keys(baseline.info), ...Object.keys(current.info)])];
    for (const key of infoKeys) {
        if (JSON.stringify(baseline.info[key]) !== JSON.stringify(current.info[key])) {
            return `info.${key} ${JSON.stringify(baseline.info[key])} -> ${JSON.stringify(current.info[key])}`;
        }
    }
    return null;
};
