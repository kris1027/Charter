import path from 'path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { VitePWA } from 'vite-plugin-pwa';
import vercelConfig from './vercel.json' with { type: 'json' };
import { reactPlugins } from './react-plugins.ts';

// vercel.json is the only place the CSP is written; the build meta tag reuses it
const contentSecurityPolicy = vercelConfig.headers
    .find((rule) => rule.source === '/(.*)')
    ?.headers.find((header) => header.key === 'Content-Security-Policy')?.value;

if (!contentSecurityPolicy) {
    throw new Error('vercel.json is missing the Content-Security-Policy header on "/(.*)"');
}

const htmlCsp = (): Plugin => ({
    name: 'html-csp',
    transformIndexHtml: {
        order: 'post',
        handler(html) {
            return html.replace(
                '<head>',
                `<head>\n    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">`,
            );
        },
    },
});

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
    plugins: [
        tanstackRouter({
            target: 'react',
            autoCodeSplitting: true,
        }),
        ...reactPlugins(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [
                'favicon.svg',
                'favicon-32x32.png',
                'favicon-16x16.png',
                'apple-touch-icon.png',
            ],
            manifest: {
                name: 'Resume Builder - Create Professional Resumes',
                short_name: 'Resume Builder',
                description: 'Create professional resumes with multiple templates and PDF export',
                theme_color: '#a7f3d0',
                background_color: '#ffffff',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                globPatterns: ['**/*.{js,css,html,svg,png,woff2,mjs,ttf}'],
                maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
                // pdf-fonts.ts adds a ?v= cache buster; match the precached font anyway
                ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^v$/],
                skipWaiting: true,
            },
        }),
        ...(command === 'build' ? [htmlCsp()] : []),
    ],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, 'src'),
        },
    },
    build: {
        // dist/.vite/manifest.json feeds the per route JS budget check (spec 0003)
        manifest: true,
        rolldownOptions: {
            output: {
                manualChunks(id) {
                    if (
                        id.includes('node_modules/motion') ||
                        id.includes('node_modules/framer-motion')
                    ) {
                        return 'motion';
                    }
                    if (
                        id.includes('node_modules/@radix-ui') ||
                        id.includes('node_modules/radix-ui')
                    ) {
                        return 'radix';
                    }
                },
            },
        },
    },
}));
