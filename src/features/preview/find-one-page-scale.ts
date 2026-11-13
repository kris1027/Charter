export type Trial = { pdf: ArrayBuffer; pages: number };
export type OnePageFit = Trial & { scale: number };

const HALVING_STEPS = 6;

// Binary search for the smallest compactScale (0 to 1) that renders to one page (spec 0013,
// AC-15). Scale 1 goes first: still over one page there means 'too-long'. Then six halving
// steps (precision 1/64), keeping the upper bound. The winning scale and its bytes are replaced
// together, so the bytes returned always belong to the scale returned. A trial that comes back
// null is a failed trial and ends the search with null.
export const findOnePageScale = async (
    render: (scale: number) => Promise<Trial | null>,
): Promise<OnePageFit | 'too-long' | null> => {
    const most = await render(1);
    if (!most) return null;
    if (most.pages > 1) return 'too-long';

    let winner: OnePageFit = { ...most, scale: 1 };
    let lo = 0;
    let hi = 1;
    for (let step = 0; step < HALVING_STEPS; step++) {
        const mid = (lo + hi) / 2;
        const trial = await render(mid);
        if (!trial) return null;
        if (trial.pages <= 1) {
            hi = mid;
            winner = { ...trial, scale: mid };
        } else {
            lo = mid;
        }
    }
    return winner;
};
