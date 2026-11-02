import '@testing-library/jest-dom/vitest';
import { toast } from 'sonner';
import { afterEach } from 'vitest';

// Polyfill ResizeObserver for Radix UI components
globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// DOM polyfills; skipped by node environment tests such as eslint.config.test.ts
if (typeof window !== 'undefined') {
    // jsdom has no pointer capture; Sonner calls it when a toast is pressed
    Element.prototype.setPointerCapture ??= () => {};
    Element.prototype.releasePointerCapture ??= () => {};
    Element.prototype.hasPointerCapture ??= () => false;

    // jsdom has no matchMedia; ThemeProvider and Sonner both call it
    window.matchMedia ??= (query: string) =>
        ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
        }) as MediaQueryList;
}

// Sonner keeps its toast list in module state, which would leak between tests
afterEach(() => {
    toast.dismiss();
});
