import type { ResumeFormValues } from '@/features/resume/form-types';
import type { ReaderCtx } from '@/features/pdf/import/readers';
import { readLevel } from '@/features/pdf/import/readers/dates';
import { cells, lineText } from '@/features/pdf/import/text-lines';
import type { TextLine, TextRun } from '@/features/pdf/import/text-lines';

// Tags (skills, interests): every cell is one item, so `React Native` stays one.
// `cells` is wrapped so flatMap's index never lands in its `gap` parameter.
export const readTags = (lines: readonly TextLine[]): { name: string }[] =>
    lines.flatMap((line) => cells(line)).map((name) => ({ name }));

// One language per line: the name in the first cell, the level in the last.
export const readLanguages = (
    lines: readonly TextLine[],
    { lang }: ReaderCtx,
): ResumeFormValues['languages'] =>
    lines.flatMap((line) => {
        const parts = cells(line);
        if (parts.length < 2) return [];
        const proficiency = readLevel(parts[parts.length - 1], lang);
        const language = parts.slice(0, -1).join(' ');
        return proficiency ? [{ language, proficiency }] : [];
    });

const firstRun = (line: TextLine): TextRun | undefined => line.runs.find((r) => r.text.trim());

// A bullet line starts with `•` (its own run, or merged into the text run).
export const isBullet = (line: TextLine) => firstRun(line)?.text.trimStart().startsWith('•');

// The largest font size on a line.
export const lineSize = (line: TextLine) => Math.max(...line.runs.map((r) => r.fontSize));

/**
 * Read the bullet block that starts at `from`. A line without a bullet joins the bullet above
 * only when it starts right of that bullet (bullet text is indented, entry lines are not), so a
 * wrapped bullet comes back whole and the next entry is never swallowed.
 * Returns the bullets as `• text` and the index of the first line after the block.
 */
export function readBullets(
    lines: readonly TextLine[],
    from: number,
): { bullets: string[]; end: number } {
    const bullets: string[] = [];
    let bulletX = 0;
    let i = from;
    for (; i < lines.length; i++) {
        const line = lines[i];
        const run = firstRun(line);
        if (!run) continue;
        if (isBullet(line)) {
            bullets.push(lineText(line).replace(/^•\s*/u, '• '));
            bulletX = run.x;
        } else if (bullets.length > 0 && run.x > bulletX + 0.5) {
            bullets[bullets.length - 1] += ` ${lineText(line)}`;
        } else break;
    }
    return { bullets, end: i };
}

// The text split at the first `separator`, both parts trimmed; the second is '' without one.
export const splitAt = (text: string, separator: string): [string, string] => {
    const i = text.indexOf(separator);
    return i < 0
        ? [text.trim(), '']
        : [text.slice(0, i).trim(), text.slice(i + separator.length).trim()];
};
