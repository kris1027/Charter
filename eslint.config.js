import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';

// One way import rule from spec 0002: pages, then the resume domain, then shared code.
const PAGE_AREAS = ['landing', 'gallery', 'builder', 'preview'];
// A regex, not a glob, so a ../ in the middle of an alias path is caught too.
const noParent = {
    regex: '(^|/)\\.\\.(/|$)',
    message: 'Use the @/ alias, never ../ (spec 0002).',
};
const ban = (paths, why) => ({ group: paths, message: `${why} (spec 0002).` });

// Full `motion` components bundle the animation engine; pages use `m` inside LazyMotion (spec 0008).
const MOTION_MESSAGE = 'Use `m` inside LazyMotion, not `motion` (spec 0008).';
const MOTION_BANS = ['motion/react', 'framer-motion'].map((name) => ({
    name,
    importNames: ['motion'],
    message: MOTION_MESSAGE,
}));

// The preview page stays still and imports nothing from the animation library (spec 0013, AC-2)
const NO_MOTION = {
    group: ['motion', 'motion/*', 'framer-motion'],
    message: 'This page area imports nothing from motion (spec 0013).',
};

// ESLint applies the last matching block for a rule, so every block repeats noParent and MOTION_BANS.
const restrict = (files, bans) => ({
    files,
    rules: {
        'no-restricted-imports': ['error', { paths: MOTION_BANS, patterns: [noParent, ...bans] }],
    },
});

const featureDirs = (names) => names.map((n) => `@/features/${n}/**`);
const entryBan = ban(
    ['@/app/**', '@/routes/**'],
    'Features and shared code never import the app shell or routes',
);
// Features and shared code sit below the app shell, so they always carry entryBan.
const restrictBelowShell = (files, bans) => restrict(files, [...bans, entryBan]);

// Token only colors in the shell (spec 0004). String.raw keeps every \b in one place.
const RAW_COLOR_PATTERNS = [
    String.raw`\b(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|[1-9]00|950)\b`,
    String.raw`\b(bg|text|border|ring|ring-offset|outline|fill|stroke|from|via|to|shadow|divide|placeholder|caret|accent|decoration)-(white|black)\b`,
    String.raw`-\[(#|oklch\(|rgb|hsl)`,
];
const RAW_COLOR_MESSAGE = 'Use a design token, not a raw palette color (spec 0004, see DESIGN.md).';
// Each Slice 3 page refresh adds its folder here
const TOKEN_ONLY_FILES = [
    'src/components/**/*.{ts,tsx}',
    'src/app/**/*.{ts,tsx}',
    'src/lib/button-variants.ts',
    'src/features/landing/**/*.{ts,tsx}',
    'src/features/gallery/**/*.{ts,tsx}',
    'src/features/builder/**/*.{ts,tsx}',
    'src/features/preview/**/*.{ts,tsx}',
];
const tokenOnly = {
    files: TOKEN_ONLY_FILES,
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
        'no-restricted-syntax': [
            'error',
            ...RAW_COLOR_PATTERNS.flatMap((pattern) => [
                { selector: `Literal[value=/${pattern}/]`, message: RAW_COLOR_MESSAGE },
                { selector: `TemplateElement[value.raw=/${pattern}/]`, message: RAW_COLOR_MESSAGE },
            ]),
        ],
    },
};

export default defineConfig([
    globalIgnores(['dist', '.agents', '.lighthouseci']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        rules: {
            // The vite preset's options, plus withForm sections count as components (spec 0005)
            'react-refresh/only-export-components': [
                'error',
                {
                    allowConstantExport: true,
                    allowCompoundComponents: true,
                    extraHOCs: ['withForm'],
                },
            ],
        },
    },
    {
        files: ['src/test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
        rules: {
            'react-refresh/only-export-components': 'off',
        },
    },
    // Node scripts for the perf checks (spec 0003); the @/ alias and ../ ban apply only to src/
    {
        files: ['scripts/**/*.ts'],
        languageOptions: { globals: globals.node },
    },
    {
        files: ['scripts/**/*.cjs', 'lighthouserc.cjs'],
        extends: [js.configs.recommended],
        languageOptions: { sourceType: 'commonjs', globals: globals.node },
    },
    // The seed script also passes functions into the page, which run in the browser
    {
        files: ['scripts/perf/lhci-seed.cjs'],
        languageOptions: { globals: { ...globals.node, ...globals.browser } },
    },
    { ...restrict(['src/**/*.{ts,tsx}'], []), ignores: ['src/routeTree.gen.ts'] },
    restrictBelowShell(
        ['src/{components,lib,hooks,i18n}/**/*.{ts,tsx}'],
        [ban(['@/features/**'], 'Shared code never imports a feature area')],
    ),
    restrictBelowShell(
        ['src/features/resume/**/*.{ts,tsx}'],
        [ban(featureDirs([...PAGE_AREAS, 'templates', 'pdf']), 'resume is the bottom domain area')],
    ),
    restrictBelowShell(
        ['src/features/templates/**/*.{ts,tsx}'],
        [ban(featureDirs([...PAGE_AREAS, 'pdf']), 'templates may import only resume and shared')],
    ),
    restrictBelowShell(
        ['src/features/pdf/**/*.{ts,tsx}'],
        [ban(featureDirs(PAGE_AREAS), 'pdf may import only templates, resume and shared')],
    ),
    ...PAGE_AREAS.map((area) =>
        restrictBelowShell(
            [`src/features/${area}/**/*.{ts,tsx}`],
            [
                ban(
                    featureDirs(PAGE_AREAS.filter((a) => a !== area)),
                    'Page areas never import each other',
                ),
                ...(area === 'preview' ? [NO_MOTION] : []),
            ],
        ),
    ),
    restrict(
        ['src/app/**/*.{ts,tsx}'],
        [ban(['@/routes/**'], 'The app shell never imports routes')],
    ),
    // Builder files stay small (spec 0005); a different rule, so it overrides nothing above
    {
        files: ['src/features/builder/**/*.{ts,tsx}'],
        ignores: ['**/*.test.{ts,tsx}'],
        rules: { 'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }] },
    },
    tokenOnly,
    eslintConfigPrettier,
]);
