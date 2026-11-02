import { cleanup, render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { afterEach } from 'vitest';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toast';
import i18n from './i18n-test';

afterEach(() => {
    cleanup();
});

const AllProviders = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
    render(ui, { wrapper: AllProviders, ...options });

// Sonner renders on a timer, so assert toasts with findBy* queries
const renderWithToaster = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
    customRender(
        <ThemeProvider>
            <Toaster />
            {ui}
        </ThemeProvider>,
        options,
    );

export { customRender as render, renderWithToaster, userEvent };
export { screen, waitFor, within } from '@testing-library/react';
