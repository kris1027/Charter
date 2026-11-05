import type { TargetAndTransition } from 'motion/react';
import { duration, ease } from '@/lib/motion-tokens';

// One shared shape for every entrance, so each keeps `viewport.once` and the `data-entrance` marker
// that the motion failure rule in index.css uses to force it visible (spec 0008)
const entrance = (
    initial: TargetAndTransition,
    whileInView: TargetAndTransition,
    delay: number,
    shouldReduceMotion: boolean | null,
) =>
    shouldReduceMotion
        ? {}
        : {
              'data-entrance': '',
              initial,
              whileInView,
              viewport: { once: true } as const,
              transition: { duration: duration.slow, delay, ease: ease.standard } as const,
          };

export const fadeInUp = (delay: number, shouldReduceMotion: boolean | null) =>
    entrance({ opacity: 0, y: 24 }, { opacity: 1, y: 0 }, delay, shouldReduceMotion);

export const fadeInScale = (delay: number, shouldReduceMotion: boolean | null) =>
    entrance({ opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1 }, delay, shouldReduceMotion);
