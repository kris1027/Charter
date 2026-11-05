import { describe, expect, it } from 'vitest';
import { createLatestOnlyRunner } from '@/features/pdf/live-preview/latest-only-runner';

const deferredRun = () => {
    const started: number[] = [];
    const finishers: Array<() => void> = [];
    const run = (job: number) =>
        new Promise<void>((resolve) => {
            started.push(job);
            finishers.push(resolve);
        });
    const finishOldest = async () => {
        finishers.shift()?.();
        await Promise.resolve();
        await Promise.resolve();
    };
    return { started, run, finishOldest };
};

describe('createLatestOnlyRunner', () => {
    it('should start a job at once when nothing is running', () => {
        const { started, run } = deferredRun();
        const submit = createLatestOnlyRunner(run);

        submit(1);

        expect(started).toEqual([1]);
    });

    it('should run only the newest waiting job when several arrive while one runs', async () => {
        const { started, run, finishOldest } = deferredRun();
        const submit = createLatestOnlyRunner(run);

        submit(1);
        submit(2);
        submit(3);
        expect(started).toEqual([1]);

        await finishOldest();
        expect(started).toEqual([1, 3]);

        await finishOldest();
        expect(started).toEqual([1, 3]);
    });

    it('should keep running later jobs when a job rejects', async () => {
        const started: number[] = [];
        const submit = createLatestOnlyRunner(async (job: number) => {
            started.push(job);
            if (job === 1) throw new Error('boom');
        });

        submit(1);
        submit(2);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(started).toEqual([1, 2]);
    });
});
