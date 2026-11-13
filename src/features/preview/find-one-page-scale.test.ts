import { describe, expect, it, vi } from 'vitest';
import { findOnePageScale, type CountedPdf } from '@/features/preview/find-one-page-scale';

// One byte per trial, holding the scale in 64ths, so a test can tell whose bytes came back
const bytesFor = (scale: number) => Uint8Array.of(Math.round(scale * 64)).buffer;

// A resume that fits one page from `threshold` up
const fitsFrom = (threshold: number) =>
    vi.fn(async (scale: number): Promise<CountedPdf | null> => ({
        pdf: bytesFor(scale),
        pages: scale >= threshold ? 1 : 2,
    }));

// The search this one replaced (spec 0013, AC-15), kept here as the reference
const previousSearch = async (pagesAt: (scale: number) => number) => {
    if (pagesAt(1) > 1) return null;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 6; i++) {
        const mid = (lo + hi) / 2;
        if (pagesAt(mid) <= 1) hi = mid;
        else lo = mid;
    }
    return hi;
};

describe('findOnePageScale', () => {
    it.each([0.01, 0.2, 0.3, 0.5, 0.77, 1])(
        'should find the same scale as the previous search when the resume fits from %s',
        async (threshold) => {
            const fit = await findOnePageScale(fitsFrom(threshold));

            expect(fit).toMatchObject({
                fit: 'fits',
                onePage: {
                    scale: await previousSearch((scale) => (scale >= threshold ? 1 : 2)),
                    pages: 1,
                },
            });
        },
    );

    it('should return the bytes rendered at the winning scale when the resume fits', async () => {
        const fit = await findOnePageScale(fitsFrom(0.3));

        expect(fit).toMatchObject({ fit: 'fits', onePage: { scale: 0.3125 } });
        if (fit.fit === 'fits') expect(new Uint8Array(fit.onePage.pdf)[0]).toBe(0.3125 * 64);
    });

    it('should try scale 1 first, then six halving steps, one at a time, when the resume fits', async () => {
        const render = fitsFrom(0.3);

        await findOnePageScale(render);

        expect(render.mock.calls.map(([scale]) => scale)).toEqual([
            1, 0.5, 0.25, 0.375, 0.3125, 0.28125, 0.296875,
        ]);
    });

    it('should stop with tooLong when scale 1 is still over one page', async () => {
        const render = fitsFrom(2);

        expect(await findOnePageScale(render)).toEqual({ fit: 'tooLong' });
        expect(render).toHaveBeenCalledTimes(1);
    });

    it('should end as failed when the first trial fails', async () => {
        expect(await findOnePageScale(async () => null)).toEqual({ fit: 'failed' });
    });

    it('should end as failed and stop when a later trial fails', async () => {
        const render = vi
            .fn<(scale: number) => Promise<CountedPdf | null>>()
            .mockResolvedValueOnce({ pdf: bytesFor(1), pages: 1 })
            .mockResolvedValueOnce({ pdf: bytesFor(0.5), pages: 1 })
            .mockResolvedValueOnce(null);

        expect(await findOnePageScale(render)).toEqual({ fit: 'failed' });
        expect(render).toHaveBeenCalledTimes(3);
    });
});
