import { describe, expect, it } from 'vitest';

import { fadeInScale, fadeInUp } from './animation-variants';

describe('fadeInUp', () => {
    it('returns animation props when reduced motion is off', () => {
        const result = fadeInUp(0.2, false);
        expect(result).toEqual({
            'data-entrance': '',
            initial: { opacity: 0, y: 24 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.4, delay: 0.2, ease: [0.2, 0, 0, 1] },
        });
    });

    it('returns empty object when reduced motion is on', () => {
        expect(fadeInUp(0.2, true)).toEqual({});
    });

    it('returns animation props when reduced motion is null (falsy)', () => {
        const result = fadeInUp(0.2, null);
        expect(result).toHaveProperty('initial');
        expect(result).toHaveProperty('whileInView');
    });
});

describe('fadeInScale', () => {
    it('returns animation props when reduced motion is off', () => {
        const result = fadeInScale(0.3, false);
        expect(result).toEqual({
            'data-entrance': '',
            initial: { opacity: 0, scale: 0.95 },
            whileInView: { opacity: 1, scale: 1 },
            viewport: { once: true },
            transition: { duration: 0.4, delay: 0.3, ease: [0.2, 0, 0, 1] },
        });
    });

    it('returns empty object when reduced motion is on', () => {
        expect(fadeInScale(0.3, true)).toEqual({});
    });
});
