import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { reactPlugins } from './react-plugins.ts';

// Real PDF renders (react-pdf plus pdfjs) run in Node in their own project (spec 0007, AC-11).
const PDF_TESTS = 'src/**/*.pdf.test.{ts,tsx}';

export default defineConfig({
    plugins: reactPlugins(),
    resolve: {
        alias: {
            '@': resolve(import.meta.dirname, 'src'),
            'virtual:pwa-register/react': resolve(
                import.meta.dirname,
                'src/test/pwa-register-mock.ts',
            ),
        },
    },
    test: {
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        projects: [
            {
                extends: true,
                test: {
                    name: 'unit',
                    environment: 'jsdom',
                    // src/lib/seo.ts throws on load without it, so tests never rely on a local .env
                    env: { VITE_SITE_URL: 'http://localhost:5173' },
                    include: [
                        'src/**/*.test.{ts,tsx}',
                        'scripts/**/*.test.ts',
                        'eslint.config.test.ts',
                    ],
                    exclude: [PDF_TESTS],
                },
            },
            {
                extends: true,
                test: {
                    name: 'pdf',
                    environment: 'node',
                    // Absolute public/ base, so pdf-fonts.ts reads the fonts from disk like the
                    // preview script (a project level Vite `base` does not reach import.meta.env).
                    env: { BASE_URL: `${resolve(import.meta.dirname, 'public')}/` },
                    testTimeout: 60000,
                    include: [PDF_TESTS],
                },
            },
        ],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/test/**',
                'src/routeTree.gen.ts',
                'src/**/*.test.{ts,tsx}',
                'src/routes/**',
                'src/main.tsx',
            ],
            thresholds: {
                lines: 50,
                functions: 50,
                branches: 50,
                statements: 50,
            },
        },
    },
});
