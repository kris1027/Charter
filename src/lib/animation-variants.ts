import { duration, ease } from '@/lib/motion-tokens';

export const fadeInUp = (delay: number, shouldReduceMotion: boolean | null) =>
    shouldReduceMotion
        ? {}
        : {
              initial: { opacity: 0, y: 24 } as const,
              whileInView: { opacity: 1, y: 0 } as const,
              viewport: { once: true } as const,
              transition: { duration: duration.slow, delay, ease: ease.standard } as const,
          };

export const fadeInScale = (delay: number, shouldReduceMotion: boolean | null) =>
    shouldReduceMotion
        ? {}
        : {
              initial: { opacity: 0, scale: 0.95 } as const,
              whileInView: { opacity: 1, scale: 1 } as const,
              viewport: { once: true } as const,
              transition: { duration: duration.slow, delay, ease: ease.standard } as const,
          };
