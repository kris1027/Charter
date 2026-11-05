// @vitest-environment node
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

// Fixture test for the raw color rule from spec 0004, run through the real eslint.config.js
const eslint = new ESLint({ cwd: import.meta.dirname });

const rawColorErrors = async (code: string, filePath: string) => {
    const [result] = await eslint.lintText(code, { filePath });
    return result.messages.filter((message) => message.ruleId === 'no-restricted-syntax');
};

describe('raw color lint rule', () => {
    it('should error on a palette class and an arbitrary color when in the app shell', async () => {
        const errors = await rawColorErrors(
            "export const a = 'text-slate-500';\nexport const b = `p-2 bg-[#fff]`;\n",
            'src/app/fixture.ts',
        );

        expect(errors).toHaveLength(2);
        expect(errors[0].message).toBe(
            'Use a design token, not a raw palette color (spec 0004, see DESIGN.md).',
        );
    });

    it('should error on white, black and oklch values when in a shared component', async () => {
        const errors = await rawColorErrors(
            "export const a = 'bg-white text-black/50 text-[oklch(0.5_0.1_250)]';\n",
            'src/components/ui/fixture.ts',
        );

        // One literal, two patterns (white or black, and an arbitrary oklch value)
        expect(errors).toHaveLength(2);
    });

    it('should pass on token classes when in the app shell', async () => {
        const errors = await rawColorErrors(
            "export const a = 'bg-primary text-muted-foreground border-input shadow-overlay';\n",
            'src/app/fixture.ts',
        );

        expect(errors).toHaveLength(0);
    });

    it('should ignore raw colors when outside the covered folders', async () => {
        const errors = await rawColorErrors(
            "export const a = 'text-slate-500';\n",
            'src/features/landing/fixture.ts',
        );

        expect(errors).toHaveLength(0);
    });
});

// Line limit for builder files from spec 0005
const maxLinesErrors = async (lines: number, filePath: string) => {
    const code = Array.from({ length: lines }, (_, i) => `export const a${i} = ${i};`).join('\n');
    const [result] = await eslint.lintText(`${code}\n`, { filePath });
    return result.messages.filter((message) => message.ruleId === 'max-lines');
};

describe('builder max-lines lint rule', () => {
    it('should error when a builder file has 251 code lines', async () => {
        expect(await maxLinesErrors(251, 'src/features/builder/fixture.ts')).toHaveLength(1);
    });

    it('should pass when a builder file has 250 code lines', async () => {
        expect(await maxLinesErrors(250, 'src/features/builder/fixture.ts')).toHaveLength(0);
    });

    it('should ignore the limit when the file is a test or outside the builder', async () => {
        expect(await maxLinesErrors(251, 'src/features/builder/fixture.test.ts')).toHaveLength(0);
        expect(await maxLinesErrors(251, 'src/features/landing/fixture.ts')).toHaveLength(0);
    });
});

// Full motion components ban from spec 0008
const importErrors = async (code: string, filePath: string) => {
    const [result] = await eslint.lintText(code, { filePath });
    return result.messages.filter((message) => message.ruleId === 'no-restricted-imports');
};

describe('motion import lint rule', () => {
    it.each([
        ["import { motion } from 'motion/react';", 'src/features/landing/fixture.tsx'],
        ["import { motion } from 'framer-motion';", 'src/components/fixture.tsx'],
        ["import { m, motion } from 'motion/react';", 'src/app/fixture.test.tsx'],
    ])('should error with the use m message when %s is in %s', async (code, filePath) => {
        const errors = await importErrors(`${code}\nexport const a = motion;\n`, filePath);

        expect(errors).toHaveLength(1);
        expect(errors[0].message).toContain('Use `m` inside LazyMotion, not `motion` (spec 0008).');
    });

    it('should pass when a file imports m and the hooks from motion/react', async () => {
        const errors = await importErrors(
            "import { m, useReducedMotion } from 'motion/react';\nexport const a = [m, useReducedMotion];\n",
            'src/features/landing/fixture.tsx',
        );

        expect(errors).toHaveLength(0);
    });

    it('should keep the area import bans when the motion ban is added', async () => {
        const errors = await importErrors(
            "import { a } from '@/features/landing/x';\nexport const b = a;\n",
            'src/features/gallery/fixture.ts',
        );

        expect(errors).toHaveLength(1);
        expect(errors[0].message).toContain('Page areas never import each other');
    });
});
