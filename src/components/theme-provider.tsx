import { useEffect, useState } from 'react';
import type { ResolvedTheme, Theme } from '@/lib/theme-context';
import { ThemeContext } from '@/lib/theme-context';
import { safeStorage } from '@/lib/storage';

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
};

// Detect system preference
const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Apply theme to document
const applyTheme = (newTheme: ResolvedTheme) => {
    const root = document.documentElement;

    // Remove both classes first
    root.classList.remove('light', 'dark');

    // Add the new theme class
    root.classList.add(newTheme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#020617' : '#ffffff');
    }
};

export const ThemeProvider = ({ children, defaultTheme = 'system' }: ThemeProviderProps) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Get saved theme from localStorage
        const savedTheme = safeStorage.getItem('theme') as Theme;
        return savedTheme || defaultTheme;
    });

    const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
    const actualTheme = theme === 'system' ? systemTheme : theme;

    // Set theme function
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        safeStorage.setItem('theme', newTheme);
    };

    // Apply the effective theme whenever it changes
    useEffect(() => {
        applyTheme(actualTheme);
    }, [actualTheme]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, actualTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
