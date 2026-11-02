import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { reactPlugins } from './react-plugins.ts';

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
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
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
