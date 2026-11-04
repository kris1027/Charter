import {
    buildTextLines,
    buildTextLineStrings,
    cells,
    headerText,
    lineText,
} from '@/features/pdf/import/text-lines';
import type { TextLine } from '@/features/pdf/import/text-lines';

const item = (str: string, x: number, y: number, width = str.length * 5, size = 9) => ({
    str,
    transform: [size, 0, 0, size, x, y],
    width,
});

const runLine = (...runs: [string, number, number][]): TextLine => ({
    y: 0,
    page: 1,
    runs: runs.map(([text, x, width]) => ({ text, x, width, fontSize: 9 })),
});

describe('buildTextLines', () => {
    it('should group items on the same row within 2 units, top to bottom and left to right', () => {
        const lines = buildTextLines(
            [item('EXPERIENCE', 60, 700.4), item('// WORK', 20, 701), item('Name', 20, 790)],
            2,
        );
        expect(lines.map(lineText)).toEqual(['Name', '// WORKEXPERIENCE']);
        expect(lines[1]).toMatchObject({ y: 700, page: 2 });
    });

    it('should keep position, width and font size of each run when it builds a line', () => {
        const [line] = buildTextLines([item('Hi', 10, 5, 12, 11)], 1);
        expect(line.runs).toEqual([{ text: 'Hi', x: 10, width: 12, fontSize: 11 }]);
    });

    it('should skip empty strings and items without text when it builds lines', () => {
        expect(buildTextLines([item('', 0, 0), { type: 'beginMarkedContent' }], 1)).toEqual([]);
    });
});

describe('buildTextLineStrings', () => {
    it('should return the joined lines and drop blank ones when the preview script reads a page', () => {
        expect(
            buildTextLineStrings([item('a', 0, 10), item('  b ', 10, 10), item(' ', 0, 50)]),
        ).toEqual(['a b']);
    });
});

describe('cells', () => {
    it('should keep a multi word tag whole when it sits next to another tag', () => {
        const line = runLine(['React Native', 20, 60], [' ', 80, 18], ['TypeScript', 98, 50]);
        expect(cells(line)).toEqual(['React Native', 'TypeScript']);
    });

    it('should join runs split at word spaces when they are less than a font size apart', () => {
        // Fira Code prints a word space 0.6 font sizes wide, as its own run
        const line = runLine(['+48', 20, 16.2], [' ', 36.2, 5.4], ['600 100', 41.6, 37.8]);
        expect(cells(line)).toEqual(['+48 600 100']);
    });

    it('should split columns when a wide whitespace run fills the gap', () => {
        const line = runLine(['Polish', 20, 32], [' ', 52, 490], ['Native', 542, 32]);
        expect(cells(line)).toEqual(['Polish', 'Native']);
    });
});

describe('headerText', () => {
    it('should close up letter spaced runs when a header prints with letter spacing', () => {
        const line = runLine(
            ['P R O F E S S I O N A L', 20, 90],
            [' ', 110, 5],
            ['E X P', 115, 20],
        );
        expect(lineText(line)).toBe('P R O F E S S I O N A L E X P');
        expect(headerText(line)).toBe('PROFESSIONAL EXP');
    });

    it('should leave ordinary words alone when the line is not letter spaced', () => {
        expect(headerText(runLine(['// WORK EXPERIENCE', 20, 90]))).toBe('// WORK EXPERIENCE');
    });
});
