import { duration, ease } from '@/lib/motion-tokens';

// `data-entrance` marks the element so the motion failure rule in index.css can force it visible (spec 0008)
export const fadeInUp = (delay: number, shouldReduceMotion: boolean | null) =>
    shouldReduceMotion
        ? {}
        : {
              'data-entrance': '',
              initial: { opacity: 0, y: 24 } as const,
              whileInView: { opacity: 1, y: 0 } as const,
              viewport: { once: true } as const,
              transition: { duration: duration.slow, delay, ease: ease.standard } as const,
          };

export const fadeInScale = (delay: number, shouldReduceMotion: boolean | null) =>
    shouldReduceMotion
        ? {}
        : {
              'data-entrance': '',
              initial: { opacity: 0, scale: 0.95 } as const,
              whileInView: { opacity: 1, scale: 1 } as const,
              viewport: { once: true } as const,
              transition: { duration: duration.slow, delay, ease: ease.standard } as const,
          };
