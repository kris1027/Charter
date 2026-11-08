import { useReducedMotion } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useParallax } from '@/hooks/use-parallax';

export type ScrollDrivenProps = {
    progress: MotionValue<number>;
    hasScrollEffects: boolean;
};

// Scroll told effects run only on large screens with motion allowed (spec 0010).
// When this is false, components apply static values instead of their scroll values.
export const useScrollEffects = (): boolean => {
    const isLargeScreen = useMediaQuery('(min-width: 64rem)');
    const shouldReduceMotion = useReducedMotion();
    return isLargeScreen && !shouldReduceMotion;
};

export const useLandingParallax = (yRange: number) => {
    const hasScrollEffects = useScrollEffects();
    const { ref, y } = useParallax({ yRange });
    return { ref, y: hasScrollEffects ? y : 0 };
};
