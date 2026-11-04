import type { TextLine, TextRun } from '@/features/pdf/import/text-lines';

type LineOptions = { size?: number; x?: number; y?: number; page?: number };

// A width per character close enough for tests; real widths come from the font.
const CHAR = 0.5;

const TOP = 800;
const LEADING = 12;

/**
 * A text line as buildTextLines would return it: each cell one run, cells far apart, word
 * spaces inside a cell. The readers never look at y; `lines` sets it so a page reads top down.
 */
export const line = (
    cells: string | string[],
    { size = 9, x = 20, y = TOP, page = 1 }: LineOptions = {},
) => {
    const runs: TextRun[] = [];
    let at = x;
    for (const text of Array.isArray(cells) ? cells : [cells]) {
        if (runs.length > 0) {
            runs.push({ text: ' ', x: at, width: size * 3, fontSize: size });
            at += size * 3;
        }
        const width = text.length * size * CHAR;
        runs.push({ text, x: at, width, fontSize: size });
        at += width;
    }
    return { y, page, runs } satisfies TextLine;
};

// Lines of one page, top to bottom.
export const lines = (...texts: (string | string[])[]) =>
    texts.map((t, i) => line(t, { y: TOP - LEADING * (i + 1) }));
