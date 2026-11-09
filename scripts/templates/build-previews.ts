// pnpm templates:previews: gallery images rendered from the real PDF templates (spec 0006).
//   (no flag)   write src/features/templates/previews/<id>-<lang>.webp, the smaller
//               <id>-<lang>-card.webp (spec 0011), plus manifest.json
//   --check     exit 1 when the committed images are stale (inputs hash differs, a file is missing)
//   --baseline  render every fixture into .cache/template-baselines/ (pixels, text, links, info)
//   --diff      render again and fail on any difference from the baseline
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { createServer } from 'vite';
import { compareBaseline, readBaselineJson, type RenderSnapshot } from './baseline.ts';
import { PREVIEW_CARD_WIDTH as CARD_WIDTH } from '../../src/features/templates/previews/preview-sizes.ts';

const root = resolve(import.meta.dirname, '../..');
const srcDir = join(root, 'src');
const publicDir = join(root, 'public');
const previewsDir = join(srcDir, 'features/templates/previews');
const manifestPath = join(previewsDir, 'manifest.json');
const baselineDir = join(root, '.cache/template-baselines');

// 2x A4 (595 x 842 pt), so the cards stay sharp on high density screens.
const RASTER_SCALE = 2;
const WEBP_QUALITY = 82;
// The gallery card height: the 2x A4 page scaled down to CARD_WIDTH, keeping its ratio.
const CARD_HEIGHT = 1019;
const SCALES = [0, 1] as const;
const VERSIONED_PACKAGES = ['@react-pdf/renderer', 'pdfjs-dist', '@napi-rs/canvas'];

// AppLang, which this script can't import (no `@/` paths under plain node).
type Lang = 'en' | 'pl';
type ResumeData = object;
type Manifest = { inputsHash: string; files: string[] };

type TemplatesModule = {
    TemplatePDF: (props: {
        templateId: string;
        data: ResumeData;
        compactScale: number;
        lang: Lang;
    }) => unknown;
};
type TemplateIdsModule = { TEMPLATE_IDS: readonly string[] };
type AppLangModule = { APP_LANGS: readonly Lang[] };
type SamplesModule = { SAMPLE_RESUMES: Record<string, Record<Lang, ResumeData>> };
type FixturesModule = {
    FIXTURE_IDS: readonly string[];
    getPreviewFixture: (fixtureId: string, templateId: string, lang: Lang) => ResumeData;
};
type TextLinesModule = { buildTextLineStrings: (items: readonly object[]) => string[] };
type RendererModule = { renderToBuffer: (element: unknown) => Promise<Uint8Array> };
type ReactModule = { createElement: (type: unknown, props: object) => unknown };

// Raw pixels of one rendered page, in RGBA order.
type Raster = { width: number; height: number; data: Uint8ClampedArray };

const mode = process.argv.includes('--check')
    ? 'check'
    : process.argv.includes('--baseline')
      ? 'baseline'
      : process.argv.includes('--diff')
        ? 'diff'
        : 'generate';

const readText = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const server = await createServer({
    configFile: false,
    root,
    appType: 'custom',
    logLevel: 'warn',
    // Absolute public/ path: pdf-fonts.ts then registers fonts as files react-pdf reads from disk.
    base: `${publicDir}${sep}`,
    resolve: { alias: { '@': srcDir } },
    server: { middlewareMode: true, hmr: false, ws: false },
    oxc: { jsx: { runtime: 'automatic' } },
});

const load = <T>(id: string) => server.ssrLoadModule(id) as Promise<T>;

try {
    const { TemplatePDF } = await load<TemplatesModule>(
        '/src/features/templates/pdf/template-pdf.tsx',
    );
    const { TEMPLATE_IDS } = await load<TemplateIdsModule>('/src/lib/template-ids.ts');
    const { APP_LANGS } = await load<AppLangModule>('/src/lib/app-lang.ts');
    const { SAMPLE_RESUMES } = await load<SamplesModule>('/src/features/resume/sample-resumes.ts');
    const fixtures = await load<FixturesModule>(
        '/src/features/templates/fixtures/preview-fixtures.ts',
    );
    const inputsHash = hashInputs();
    const files = TEMPLATE_IDS.flatMap((id) =>
        APP_LANGS.flatMap((lang) => [`${id}-${lang}.webp`, `${id}-${lang}-card.webp`]),
    );

    if (mode === 'check') {
        process.exitCode = checkManifest(inputsHash, files) ? 0 : 1;
    } else {
        // Plain Node imports: Vite externalizes these for the app modules, so it is one instance.
        const { renderToBuffer } = (await import('@react-pdf/renderer')) as RendererModule;
        const { createElement } = (await import('react')) as ReactModule;
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const { createCanvas, loadImage } = await import('@napi-rs/canvas');

        // One document at a time: react-pdf and pdfjs both hold large buffers per render,
        // so the pdfjs document is destroyed as soon as `read` is done with it.
        const withPdf = async <T>(
            templateId: string,
            data: ResumeData,
            lang: Lang,
            scale: number,
            read: (pdf: PdfDocument) => Promise<T>,
        ) => {
            const element = createElement(TemplatePDF, {
                templateId,
                data,
                compactScale: scale,
                lang,
            });
            const buffer = await renderToBuffer(element);
            // The legacy build in Node runs without a worker and creates canvases through its
            // NodeCanvasFactory, backed by @napi-rs/canvas. pdfjs 6 dropped `isEvalSupported`.
            const task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
            try {
                return await read(await task.promise);
            } finally {
                await task.destroy();
            }
        };

        type PdfDocument = Awaited<ReturnType<typeof pdfjs.getDocument>['promise']>;

        const renderPage = async (pdf: PdfDocument, pageNumber: number) => {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: RASTER_SCALE });
            const canvas = createCanvas(viewport.width, viewport.height);
            // pdfjs's types expect a DOM canvas; @napi-rs/canvas is the one its Node build uses.
            await page.render({ canvas: canvas as never, viewport }).promise;
            return canvas;
        };

        if (mode === 'generate') {
            mkdirSync(previewsDir, { recursive: true });
            for (const templateId of TEMPLATE_IDS) {
                for (const lang of APP_LANGS) {
                    const data = SAMPLE_RESUMES[templateId][lang];
                    const images = await withPdf(templateId, data, lang, 0, async (pdf) => {
                        const page = await renderPage(pdf, 1);
                        const card = createCanvas(CARD_WIDTH, CARD_HEIGHT);
                        const context = card.getContext('2d');
                        context.imageSmoothingQuality = 'high';
                        context.drawImage(page, 0, 0, CARD_WIDTH, CARD_HEIGHT);
                        return {
                            [`${templateId}-${lang}.webp`]: await page.encode('webp', WEBP_QUALITY),
                            [`${templateId}-${lang}-card.webp`]: await card.encode(
                                'webp',
                                WEBP_QUALITY,
                            ),
                        };
                    });
                    for (const [file, image] of Object.entries(images)) {
                        writeFileSync(join(previewsDir, file), image);
                        console.log(`wrote ${relative(root, join(previewsDir, file))}`);
                    }
                }
            }
            const manifest: Manifest = { inputsHash, files };
            writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`);
            console.log(`wrote ${relative(root, manifestPath)}`);
        } else {
            const { buildTextLineStrings } = await load<TextLinesModule>(
                '/src/features/pdf/import/text-lines.ts',
            );

            const snapshot = async (pdf: PdfDocument): Promise<RenderSnapshot> => {
                const lines: string[] = [];
                const links: string[] = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    lines.push(...buildTextLineStrings((await page.getTextContent()).items));
                    for (const annotation of await page.getAnnotations()) {
                        if (annotation.subtype === 'Link' && annotation.url)
                            links.push(annotation.url);
                    }
                }
                const { info } = (await pdf.getMetadata()) as { info: Record<string, unknown> };
                const pick = ['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Language'];
                return {
                    pages: pdf.numPages,
                    lines,
                    links,
                    info: Object.fromEntries(pick.map((key) => [key, info[key] ?? null])),
                };
            };

            const readPng = async (path: string): Promise<Raster> => {
                const image = await loadImage(readFileSync(path));
                const context = createCanvas(image.width, image.height).getContext('2d');
                context.drawImage(image, 0, 0);
                const { data } = context.getImageData(0, 0, image.width, image.height);
                return { width: image.width, height: image.height, data };
            };

            if (mode === 'baseline') {
                rmSync(baselineDir, { recursive: true, force: true });
                mkdirSync(baselineDir, { recursive: true });
            } else if (!existsSync(baselineDir)) {
                throw new Error('No baseline found, run pnpm templates:previews --baseline first');
            }

            const failures: string[] = [];
            let renders = 0;
            for (const templateId of TEMPLATE_IDS) {
                for (const lang of APP_LANGS) {
                    for (const fixtureId of fixtures.FIXTURE_IDS) {
                        for (const scale of SCALES) {
                            const name = `${templateId}-${lang}-${fixtureId}-${scale}`;
                            const data = fixtures.getPreviewFixture(fixtureId, templateId, lang);
                            await withPdf(templateId, data, lang, scale, async (pdf) => {
                                const current = await snapshot(pdf);
                                const jsonPath = join(baselineDir, `${name}.json`);

                                if (mode === 'baseline') {
                                    writeFileSync(
                                        jsonPath,
                                        `${JSON.stringify(current, null, 4)}\n`,
                                    );
                                } else {
                                    const jsonProblem = compareBaseline(
                                        readBaselineJson(jsonPath),
                                        current,
                                    );
                                    if (jsonProblem) failures.push(`${name}.json: ${jsonProblem}`);
                                }

                                for (let page = 1; page <= pdf.numPages; page++) {
                                    const canvas = await renderPage(pdf, page);
                                    const pngPath = join(baselineDir, `${name}-p${page}.png`);
                                    if (mode === 'baseline') {
                                        writeFileSync(pngPath, await canvas.encode('png'));
                                        continue;
                                    }
                                    if (!existsSync(pngPath)) {
                                        failures.push(`${name}-p${page}.png: no baseline page`);
                                        continue;
                                    }
                                    const base = await readPng(pngPath);
                                    const { width, height } = canvas;
                                    const { data } = canvas
                                        .getContext('2d')
                                        .getImageData(0, 0, width, height);
                                    const changed = countChangedPixels(base, {
                                        width,
                                        height,
                                        data,
                                    });
                                    if (changed > 0) {
                                        failures.push(
                                            `${name}-p${page}.png: ${changed} changed pixels`,
                                        );
                                    }
                                }
                            });
                            renders++;
                        }
                    }
                }
            }

            if (mode === 'baseline') {
                console.log(`Baseline: ${renders} renders in ${relative(root, baselineDir)}`);
            } else if (failures.length > 0) {
                for (const failure of failures) console.error(`✗ ${failure}`);
                console.error(
                    `Template diff failed: ${failures.length} of ${renders} renders differ`,
                );
                process.exitCode = 1;
            } else {
                console.log(`Template diff passed: ${renders} renders match the baseline`);
            }
        }
    }
} finally {
    await server.close();
}

// Every input that changes what the images look like (spec 0006, AC-2).
function hashInputs(): string {
    const moduleFiles = [...server.environments.ssr.moduleGraph.fileToModulesMap.keys()]
        .map((file) => file.split('?')[0])
        .filter((file) => file.startsWith(srcDir + sep) && !file.includes('node_modules'))
        .filter((file) => existsSync(file));
    const fontFiles = readdirSync(join(publicDir, 'fonts'))
        .filter((file) => file.endsWith('.ttf'))
        .map((file) => join(publicDir, 'fonts', file));
    const scriptFiles = readdirSync(import.meta.dirname)
        .filter((file) => file.endsWith('.ts'))
        .map((file) => join(import.meta.dirname, file));

    const hash = createHash('sha256');
    for (const file of [...new Set([...moduleFiles, ...scriptFiles])].sort()) {
        hash.update(`${relative(root, file).split(sep).join('/')}\n`);
        hash.update(readText(file));
    }
    for (const file of fontFiles.sort()) {
        hash.update(`${relative(root, file).split(sep).join('/')}\n`);
        hash.update(readFileSync(file));
    }
    for (const name of VERSIONED_PACKAGES) {
        const { version } = JSON.parse(
            readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8'),
        ) as { version: string };
        hash.update(`${name}@${version}\n`);
    }
    return hash.digest('hex');
}

function checkManifest(inputsHash: string, files: string[]): boolean {
    const stale = () => {
        console.error('Template previews are stale, run pnpm templates:previews');
        return false;
    };
    if (!existsSync(manifestPath)) return stale();
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
    if (manifest.inputsHash !== inputsHash) return stale();
    if (files.some((file) => !existsSync(join(previewsDir, file)))) return stale();
    console.log('Template previews are current');
    return true;
}

function countChangedPixels(a: Raster, b: Raster): number {
    if (a.width !== b.width || a.height !== b.height) return a.width * a.height;
    let changed = 0;
    for (let i = 0; i < a.data.length; i += 4) {
        if (
            a.data[i] !== b.data[i] ||
            a.data[i + 1] !== b.data[i + 1] ||
            a.data[i + 2] !== b.data[i + 2] ||
            a.data[i + 3] !== b.data[i + 3]
        ) {
            changed++;
        }
    }
    return changed;
}
