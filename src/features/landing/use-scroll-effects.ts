import { useReducedMotion } from 'motion/react';
import { useMediaQuery } from '@/hooks/use-media-query';

// Scroll told effects run only on large screens with motion allowed (spec 0010).
// When this is false, components apply static values instead of their scroll values.
export const useScrollEffects = (): boolean => {
    const isLargeScreen = useMediaQuery('(min-width: 64rem)');
    const shouldReduceMotion = useReducedMotion();
    return isLargeScreen && !shouldReduceMotion;
};
