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
