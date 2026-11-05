// Runs one job at a time; a job that arrives while one runs waits, and a newer arrival replaces
// it, so at most one runs and at most one waits (spec 0009). The preview worker uses it because
// the client sends the next render when its 30 second timeout expires, even if the old one runs on.
export const createLatestOnlyRunner = <T>(run: (job: T) => Promise<void>) => {
    let running = false;
    let waiting: { job: T } | null = null;

    const next = async () => {
        if (running || !waiting) return;
        const { job } = waiting;
        waiting = null;
        running = true;
        try {
            await run(job);
        } catch {
            // run reports its own failures; a rejection must not stop the jobs after it
        } finally {
            running = false;
            void next();
        }
    };

    return (job: T) => {
        waiting = { job };
        void next();
    };
};
