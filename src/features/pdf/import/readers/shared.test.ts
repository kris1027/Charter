import {
    readBullets,
    readLanguages,
    readTags,
    splitAt,
} from '@/features/pdf/import/readers/shared';
import { line, lines } from '@/test/pdf-lines';

describe('readTags', () => {
    it('should read one item per cell when tags sit side by side', () => {
        expect(readTags([line(['React Native', 'TypeScript']), line('Go')])).toEqual([
            { name: 'React Native' },
            { name: 'TypeScript' },
            { name: 'Go' },
        ]);
    });

    it('should keep a multi word tag whole when it arrives as word runs on the first line', () => {
        const runs = [
            { text: 'React', x: 20, width: 15, fontSize: 9 },
            { text: ' ', x: 35, width: 3, fontSize: 9 },
            { text: 'Native', x: 38, width: 18, fontSize: 9 },
        ];
        expect(readTags([{ y: 700, page: 1, runs }])).toEqual([{ name: 'React Native' }]);
    });
});

describe('readLanguages', () => {
    it('should read the language and its level from the two columns', () => {
        expect(
            readLanguages([line(['Polski', 'Ojczysty']), line(['English', 'B2'])], { lang: 'pl' }),
        ).toEqual([
            { language: 'Polski', proficiency: 'NATIVE' },
            { language: 'English', proficiency: 'B2' },
        ]);
    });

    it('should skip lines without a known level', () => {
        expect(readLanguages([line(['Polish', 'Good']), line('English')], { lang: 'en' })).toEqual(
            [],
        );
    });
});

describe('readBullets', () => {
    it('should join a wrapped bullet when the next line starts right of the bullet', () => {
        const block = [line('• First point that'), line('wraps here', { x: 30 }), line('• Second')];
        expect(readBullets(block, 0)).toEqual({
            bullets: ['• First point that wraps here', '• Second'],
            end: 3,
        });
    });

    it('should stop at a line that starts where the bullets start', () => {
        const block = [line('• Point'), line('Company 2 | Role')];
        expect(readBullets(block, 0)).toEqual({ bullets: ['• Point'], end: 1 });
    });

    it('should read a bullet printed as its own run', () => {
        expect(readBullets([line(['•', 'Point'])], 0).bullets).toEqual(['• Point']);
    });

    it('should read nothing when the block does not start with a bullet', () => {
        expect(readBullets(lines('Plain', '• Later'), 0)).toEqual({ bullets: [], end: 0 });
    });
});

describe('splitAt', () => {
    it('should split at the first separator only', () => {
        expect(splitAt('a | b | c', '|')).toEqual(['a', 'b | c']);
        expect(splitAt('a', '|')).toEqual(['a', '']);
    });
});
