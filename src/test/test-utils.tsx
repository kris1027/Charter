import { act, cleanup, render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
    RouterProvider,
    type RouteComponent,
} from '@tanstack/react-router';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { afterEach } from 'vitest';

import { ThemeProvider } from '@/components/theme-provider';
import { validateBuilderSearch } from '@/features/builder/builder-search';
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

// Lets Sonner's timers run so a toast that should not appear has had its chance
const flushToasts = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)));

// A minimal inline route tree (never the real src/routes): the page under test at /builder,
// plus a /preview stub so navigation can be asserted
const renderWithRouter = async (page: RouteComponent, { initialEntry = '/builder' } = {}) => {
    const rootRoute = createRootRoute({ component: Outlet });
    const builderRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/builder',
        validateSearch: validateBuilderSearch,
        component: page,
    });
    const previewRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/preview',
        component: () => <p>preview stub</p>,
    });
    const router = createRouter({
        routeTree: rootRoute.addChildren([builderRoute, previewRoute]),
        history: createMemoryHistory({ initialEntries: [initialEntry] }),
    });
    await router.load();
    const result = customRender(
        <ThemeProvider>
            <RouterProvider router={router} />
        </ThemeProvider>,
    );
    return { ...result, router };
};

export { customRender as render, flushToasts, renderWithRouter, renderWithToaster, userEvent };
export { screen, waitFor, within } from '@testing-library/react';
