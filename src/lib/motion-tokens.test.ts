/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { duration, ease } from './motion-tokens';

// Read from disk: Vitest blanks CSS imports, even with ?raw
const css = readFileSync(resolve(import.meta.dirname, '../index.css'), 'utf8');

const cssValue = (name: string) => {
    const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
    if (!match) throw new Error(`--${name} is missing from index.css`);
    return match[1].trim();
};

describe('motion tokens', () => {
    it.each(Object.entries(duration))(
        'should match --duration-%s in index.css',
        (name, seconds) => {
            expect(cssValue(`duration-${name}`)).toBe(`${Math.round(seconds * 1000)}ms`);
        },
    );

    it.each(Object.entries(ease))('should match --ease-%s in index.css', (name, points) => {
        expect(cssValue(`ease-${name}`)).toBe(`cubic-bezier(${points.join(', ')})`);
    });
});
