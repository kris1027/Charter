import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { LazyMotion } from 'motion/react';

// Long enough for a slow 3G fetch of the features file, short enough that content never looks missing (spec 0008)
export const MOTION_STALL_MS = 8000;

type MotionStatus = 'loading' | 'loaded' | 'failed';

type MotionProviderProps = {
    children: ReactNode;
};

// Pages render `m.*` (not `motion.*`); strict throws if a full `motion` component sneaks back in (spec 0008)
export const MotionProvider = ({ children }: MotionProviderProps) => {
    const [status, setStatus] = useState<MotionStatus>('loading');

    // LazyMotion calls this once and only ever uses `.then`, so a failure resolves to a promise
    // that never settles instead of rejecting. No retry: a failed import stays failed this session.
    const loadFeatures = () =>
        import('@/lib/motion-features').then(
            (mod) => {
                setStatus((current) => (current === 'loading' ? 'loaded' : current));
                return mod.default;
            },
            () => {
                setStatus('failed');
                return new Promise<never>(() => {});
            },
        );

    useEffect(() => {
        if (status !== 'loading') return;
        const timer = setTimeout(() => setStatus('failed'), MOTION_STALL_MS);
        return () => clearTimeout(timer);
    }, [status]);

    // index.css forces every [data-entrance] element visible under this flag
    useEffect(() => {
        if (status !== 'failed') return;
        const root = document.documentElement;
        root.setAttribute('data-motion-failed', '');
        return () => root.removeAttribute('data-motion-failed');
    }, [status]);

    return (
        <LazyMotion features={loadFeatures} strict>
            {children}
        </LazyMotion>
    );
};
