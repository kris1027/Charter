// Known axe findings that do not fail the scan (spec 0014, AC-2, AC-5). Axe always runs every
// rule. A rule exception drops a matching violation (rule id and target) from the failing set
// after the run, and the report still lists it as excepted. A narrowing exception fails an open
// state only on what axe finds inside its overlay, for violations Radix itself causes on the page
// behind it; the whole page is still scanned and the rest is listed as excepted. Every entry needs
// a reason.
import type { PagePath } from './axe-matrix.ts';

export type RuleException = {
    kind: 'rule';
    /** The axe rule id, such as `color-contrast` */
    rule: string;
    /** The violating node's target selector, exactly as axe prints it */
    selector: string;
    /** Every variant and state of these pages */
    paths: PagePath[];
    reason: string;
};

export type NarrowException = {
    kind: 'narrow';
    /** The open state's name in the matrix */
    state: string;
    /** What axe scans instead of the whole page */
    selector: string;
    paths: PagePath[];
    reason: string;
};

export type AxeException = RuleException | NarrowException;

export const AXE_EXCEPTIONS: AxeException[] = [
    {
        kind: 'narrow',
        state: 'language level select',
        selector: '[role="listbox"]',
        paths: ['/builder'],
        reason: 'Radix Select is always modal: while open it sets aria-hidden on the rest of the page and traps focus in the list, so axe reports every focusable field behind it (aria-hidden-focus), plus the missing h1 and landmarks. Nothing behind it can take focus while it is open; the page itself is covered by the /builder load scans.',
    },
];

export const narrowingFor = (exceptions: AxeException[], path: PagePath, state: string) =>
    exceptions.find(
        (exception): exception is NarrowException =>
            exception.kind === 'narrow' &&
            exception.state === state &&
            exception.paths.includes(path),
    );

/** Throws before any scan runs when an entry has no reason. */
export const checkExceptions = (exceptions: AxeException[]) => {
    const missing = exceptions.filter((exception) => exception.reason.trim() === '');
    if (missing.length > 0) {
        const list = missing.map((exception) =>
            exception.kind === 'rule'
                ? `${exception.rule} on ${exception.selector}`
                : `narrowing ${exception.state} to ${exception.selector}`,
        );
        throw new Error(`Axe exceptions need a reason: ${list.join(', ')}`);
    }
};
