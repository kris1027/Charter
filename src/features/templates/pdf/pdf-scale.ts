// Shrinks a size from `normal` (t = 0) to `min` (t = 1, most compact), rounded to 0.1.
export const lerp = (normal: number, min: number, t: number) =>
    Math.round((normal + (min - normal) * t) * 10) / 10;
