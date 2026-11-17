/** Runs a script's `main` and exits with the code it returns; a thrown error prints and exits 1. */
export const runMain = (main: () => Promise<number>) =>
    main().then(
        (code) => process.exit(code),
        (error: unknown) => {
            console.error(error instanceof Error ? error.message : error);
            process.exit(1);
        },
    );
