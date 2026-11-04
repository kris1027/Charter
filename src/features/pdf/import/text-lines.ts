// One pdfjs text item: a glyph run with its position (transform[4], transform[5]) and width.
type TextItem = { str: string; transform: number[]; width?: number };

export type TextRun = { text: string; x: number; width: number; fontSize: number };

export type TextLine = { y: number; page: number; runs: TextRun[] };

const isTextItem = (item: object): item is TextItem => 'str' in item && 'transform' in item;

// Runs further apart than this many font sizes are separate cells (a tag, a column).
// pdfjs fills every gap with a whitespace run, so gaps are measured between text runs.
// 1 (tuned from 0.5): a Fira Code word space is 0.6 font sizes, while the smallest cell gap
// in any template (veterinary tags) is about 1.6 and contact items are above 3.
export const CELL_GAP = 1;

/**
 * Rebuild the visual lines of one PDF page from pdfjs text items.
 *
 * pdfjs returns one text item per glyph run, not per visual line, so naively joining items
 * shatters headers and entries (e.g. "// WORK EXPERIENCE" arrives as "//" and "WORK
 * EXPERIENCE"). Items on the same vertical position (transform[5], within 2 units) form one
 * line, top to bottom, runs left to right, keeping each run's position and size for the readers.
 */
export function buildTextLines(items: readonly object[], page: number): TextLine[] {
    const rows = new Map<number, TextRun[]>();
    for (const item of items) {
        if (!isTextItem(item) || !item.str) continue;
        const y = Math.round(item.transform[5]);
        const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
        const row = rows.get(key) ?? [];
        row.push({
            text: item.str,
            x: item.transform[4],
            width: item.width ?? 0,
            fontSize: Math.hypot(item.transform[2], item.transform[3]),
        });
        rows.set(key, row);
    }

    // Top to bottom (PDF Y grows upward), each row left to right.
    return [...rows.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([y, runs]) => ({ y, page, runs: runs.sort((a, b) => a.x - b.x) }));
}

// Whitespace runs closed up to single spaces, ends trimmed.
export const collapse = (text: string) => text.replace(/\s+/gu, ' ').trim();

// The line as one string: runs joined as printed, whitespace collapsed.
export const lineText = (line: TextLine): string => collapse(line.runs.map((r) => r.text).join(''));

const isBlank = (run: TextRun) => run.text.trim().length === 0;

// The line split wherever two text runs sit further apart than CELL_GAP font sizes.
export const cells = (line: TextLine, gap = CELL_GAP): string[] => {
    const groups: TextRun[][] = [];
    let previous: TextRun | undefined;
    for (const run of line.runs) {
        if (isBlank(run)) {
            groups.at(-1)?.push(run);
            continue;
        }
        const apart = previous && run.x - (previous.x + previous.width) > gap * run.fontSize;
        if (!previous || apart) groups.push([run]);
        else groups.at(-1)?.push(run);
        previous = run;
    }
    return groups
        .map((runs) => collapse(runs.map((r) => r.text).join('')))
        .filter((text) => text.length > 0);
};

// A run printed with letter spacing comes back from pdfjs as `P R O F I L E`.
const LETTER_SPACED = /^\S( \S)+$/u;

// The line as a header reads: like lineText, with letter spaced runs closed up again.
export const headerText = (line: TextLine): string =>
    collapse(
        line.runs
            .map((r) => (LETTER_SPACED.test(r.text.trim()) ? r.text.replace(/ /g, '') : r.text))
            .join(''),
    );

// Plain line strings, as the preview script snapshots them (empty lines dropped).
export const buildTextLineStrings = (items: readonly object[]): string[] =>
    buildTextLines(items, 1)
        .map(lineText)
        .filter((text) => text.length > 0);
