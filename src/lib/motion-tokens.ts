// Mirror of the motion tokens in index.css for `motion` (seconds, cubic bezier points).
// motion-tokens.test.ts fails if the two drift apart (spec 0004).
export const duration = {
    fast: 0.15,
    base: 0.25,
    slow: 0.4,
} as const;

export const ease = {
    standard: [0.2, 0, 0, 1],
    exit: [0.4, 0, 1, 1],
} as const;
