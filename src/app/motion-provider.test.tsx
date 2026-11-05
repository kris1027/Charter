import { afterEach, describe, expect, it, vi } from 'vitest';

const never = () => new Promise<never>(() => {});

// `settle` decides how `import('@/lib/motion-features')` ends. A fresh module graph per test makes
// the factory run again (doMock, since a resolved factory is cached); React and the renderer come
// from that graph too, so they match the provider's copy. That is why this file imports
// `@testing-library/react` directly instead of `@/test/test-utils`: the shared wrapper would come
// from the outer graph and render a second copy of React.
const renderProvider = async (settle: () => Promise<unknown>) => {
    vi.resetModules();
    vi.doMock('@/lib/motion-features', settle);
    const { createElement } = await import('react');
    const { act, render, screen } = await import('@testing-library/react');
    const { m } = await import('motion/react');
    const { fadeInUp } = await import('@/lib/animation-variants');
    const { MotionProvider, MOTION_STALL_MS } = await import('./motion-provider');

    const view = render(
        createElement(
            MotionProvider,
            null,
            createElement(m.div, { ...fadeInUp(0, false) }, 'Entrance content'),
        ),
    );
    // Lets the provider's effect start the import and the import settle
    await act(async () => {
        await Promise.resolve();
    });
    return { act, view, stallMs: MOTION_STALL_MS, element: screen.getByText('Entrance content') };
};

const isFailed = () => document.documentElement.hasAttribute('data-motion-failed');

afterEach(() => {
    vi.doUnmock('@/lib/motion-features');
    vi.useRealTimers();
    document.documentElement.removeAttribute('data-motion-failed');
});

describe('MotionProvider', () => {
    it('should flag motion as failed without an unhandled rejection when the features file fails to load', async () => {
        const { view, element } = await renderProvider(() =>
            Promise.reject(new Error('chunk load failed')),
        );

        await vi.waitFor(() => expect(isFailed()).toBe(true));
        expect(element).toHaveAttribute('data-entrance');
        view.unmount();
    });

    it('should flag motion as failed when the features file has not loaded after 8 seconds', async () => {
        vi.useFakeTimers();
        const { act, view, stallMs } = await renderProvider(never);
        await act(async () => {
            vi.advanceTimersByTime(stallMs - 1);
        });
        expect(isFailed()).toBe(false);

        await act(async () => {
            vi.advanceTimersByTime(1);
        });
        expect(isFailed()).toBe(true);
        view.unmount();
    });

    it('should not flag motion as failed when the features file loads before 8 seconds', async () => {
        vi.useFakeTimers();
        const { act, view, stallMs } = await renderProvider(async () => {
            const { domAnimation } = await import('motion/react');
            return { default: domAnimation };
        });
        await act(async () => {
            vi.advanceTimersByTime(stallMs * 2);
        });

        expect(isFailed()).toBe(false);
        view.unmount();
    });

    it('should remove the failure flag when the provider unmounts', async () => {
        const { view } = await renderProvider(() => Promise.reject(new Error('chunk load failed')));
        await vi.waitFor(() => expect(isFailed()).toBe(true));

        view.unmount();
        expect(isFailed()).toBe(false);
    });
});
