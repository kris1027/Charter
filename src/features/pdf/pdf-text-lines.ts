type TextItem = { str: string; transform: number[] };

const isTextItem = (item: object): item is TextItem => 'str' in item && 'transform' in item;

/**
 * Rebuild the visual lines of one PDF page from pdfjs text items.
 *
 * pdfjs returns one text item per glyph run, not per visual line, so naively
 * joining items shatters headers and entries (e.g. "// WORK EXPERIENCE" arrives
 * as "//" and "WORK EXPERIENCE"). We reconstruct visual lines by grouping items
 * on the same vertical position (transform[5]) and ordering them left-to-right,
 * so the downstream line-based parser sees whole lines. Shared by the import and
 * the template preview script (spec 0006), so both read a PDF the same way.
 */
export function buildTextLines(items: readonly object[]): string[] {
    const lines: string[] = [];

    // Bucket items by their (rounded) Y position, tolerating sub-pixel drift.
    const rows = new Map<number, { x: number; str: string }[]>();
    for (const item of items) {
        if (!isTextItem(item) || !item.str) continue;
        const y = Math.round(item.transform[5]);
        const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
        const row = rows.get(key) ?? [];
        row.push({ x: item.transform[4], str: item.str });
        rows.set(key, row);
    }

    // Top-to-bottom (PDF Y grows upward), each row left-to-right.
    const sortedRows = [...rows.entries()].sort((a, b) => b[0] - a[0]);
    for (const [, row] of sortedRows) {
        row.sort((a, b) => a.x - b.x);
        const line = row
            .map((r) => r.str)
            .join('')
            .replace(/\s+/g, ' ')
            .trim();
        if (line) lines.push(line);
    }

    return lines;
}
