// PDF bytes together with their page count
export type CountedPdf = { pdf: ArrayBuffer; pages: number };
export type OnePageFit = CountedPdf & { scale: number };

// How the search ended: with a one page version, with a resume too long for one page even at
// the smallest size, or with a trial that failed
export type OnePageSearch =
    { fit: 'fits'; onePage: OnePageFit } | { fit: 'tooLong' } | { fit: 'failed' };

const HALVING_STEPS = 6;

// Binary search for the smallest compactScale (0 to 1) that renders to one page (spec 0013,
// AC-15). Scale 1 goes first: still over one page there means 'tooLong'. Then six halving
// steps (precision 1/64), keeping the upper bound. The winning scale and its bytes are replaced
// together, so the bytes returned always belong to the scale returned. A trial that comes back
// null is a failed trial and ends the search as 'failed'.
export const findOnePageScale = async (
    render: (scale: number) => Promise<CountedPdf | null>,
): Promise<OnePageSearch> => {
    const most = await render(1);
    if (!most) return { fit: 'failed' };
    if (most.pages > 1) return { fit: 'tooLong' };

    let winner: OnePageFit = { ...most, scale: 1 };
    let lo = 0;
    let hi = 1;
    for (let step = 0; step < HALVING_STEPS; step++) {
        const mid = (lo + hi) / 2;
        const trial = await render(mid);
        if (!trial) return { fit: 'failed' };
        if (trial.pages <= 1) {
            hi = mid;
            winner = { ...trial, scale: mid };
        } else {
            lo = mid;
        }
    }
    return { fit: 'fits', onePage: winner };
};
