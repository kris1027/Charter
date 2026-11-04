import type { TextLine, TextRun } from '@/features/pdf/import/text-lines';

type LineOptions = { size?: number; x?: number; page?: number };

// A width per character close enough for tests; real widths come from the font.
const CHAR = 0.5;

/**
 * A text line as buildTextLines would return it: each cell one run, cells far apart, word
 * spaces inside a cell. Lines get descending y in the order they are made, like a page.
 */
let nextY = 800;
export const line = (
    cells: string | string[],
    { size = 9, x = 20, page = 1 }: LineOptions = {},
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
    nextY -= 12;
    return { y: nextY, page, runs } satisfies TextLine;
};

export const lines = (...texts: (string | string[])[]) => texts.map((t) => line(t));
