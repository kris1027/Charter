# 0008. Lazy load heavy engines: LazyMotion for animations, a lazy viewer for PDFs

**Date**: 2026-11-05
**Status**: Accepted
**Ratified**: 2026-11-05, by `/architect` from the `Assumed` record `/develop` wrote the same day. The LazyMotion assumption holds. Ratifying added three tasks (Build plan 6 to 8): a fallback for when the motion engine fails or stalls, a lint guard against full `motion` components, and a check that fails a page whose first load contains an engine. A cross check on another model then corrected two of those designs before acceptance: the fallback now uses a CSS override, and the leak check looks for engine chunks instead of closures.

## Summary

Pages used to download heavy engines before they could show anything. These were the PDF renderer (react-pdf, about 350 KiB) on the two PDF pages, and the motion animation library on every page. Now each engine loads only when it is needed. The PDF viewer is a lazy component that streams in after the page appears. Animations use motion's small `m` components, and the animation engine (`domAnimation`) arrives in its own file after the first paint. The look stays the same. Three guards keep it that way: content still shows if the animation file fails or stalls, lint rejects full `motion` components, and the size check fails a page that pulls an engine back into its first load.

## Requirements

**User stories**:

- As a visitor on a slow phone, I want the home page to show its content without first downloading PDF or animation engines, so it opens fast.
- As a job seeker, I want the preview and template pages to show their frame at once and the PDF right after, so the app never feels stuck.
- As a maintainer, I want CI to fail when someone pulls an engine back into a page's first load, so the gain cannot quietly erode.

**Acceptance criteria**:

- **AC-1**: The landing page's first load ships no `@react-pdf/renderer`, no `pdfjs-dist`, no PDF fonts and no motion animation engine (`domAnimation`). The `m` component shell and the `useScroll` / `useTransform` parallax hooks (about 18 KiB brotli) are allowed in the first load.
- **AC-2**: `/preview` and `/templates/$templateId` do not load `@react-pdf/renderer` up front. The page shell renders first, then the viewer streams in. While it loads, `/preview` shows its placeholder text and the template page shows its decorative background.
- **AC-3**: Export and import still work offline once the app has been loaded once (every lazy chunk is in the PWA precache).
- **AC-4**: Every route meets its JS budget in `perf/budgets.json`, and the budgets are lowered to the new sizes plus 5% (spec 0003).
- **AC-5**: Animations look and behave as before: entrance fades play once when an element scrolls into view, parallax moves only decorative layers, and with `prefers-reduced-motion` the content shows without entrance animation.
- **AC-6**: If the motion features file fails to load, or has not loaded 8 seconds after `MotionProvider` mounts, every element that would have faded in becomes fully visible (opacity 1, no offset), including ones already on screen, with no unhandled promise rejection in the console.
- **AC-7**: Importing the `motion` named export from `motion/react` (or `framer-motion`) fails `pnpm lint` with a message that says to use `m`. At runtime, `LazyMotion strict` throws if a full `motion.*` component renders.
- **AC-8**: `pnpm perf:size` fails, naming the route and the engine, when any route's first load contains a lazy engine's own chunk (the react-pdf library, the PDF viewer, the PDF template renderer, pdf.js, or the motion features). It also fails when an engine entry matches no chunk in the build, or when the engine list is empty.

## Decision

**Chosen option**: Option 2, LazyMotion with async features, plus a lazy PDF viewer.

Every page renders `m.*` inside one app wide `LazyMotion strict` whose features load through `import()`. The PDF viewer is a `React.lazy` component, and every other PDF render goes through one `renderResumePdf` helper that loads the engine on call.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

No data model. Nothing about the saved resume shape changes.

**Modules**:

| Module                                                | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/motion-features.ts`                          | Default export `domAnimation`. Only ever reached through `import()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `src/app/motion-provider.tsx`                         | `LazyMotion features={loadFeatures} strict` around the route outlet. `loadFeatures` is created inside the component (so it can reach state) and wraps the `import()` itself in `.catch`. On failure it marks motion as failed and returns a promise that never settles, so nothing is thrown or rejected (`LazyMotion` only calls `.then`). A `setTimeout` of 8 seconds, cleared when the features resolve, marks it failed too. Marking failed sets `data-motion-failed` on `document.documentElement` in an effect. No retry: a failed `import()` stays failed for that page session. React StrictMode runs the load effect twice in development, which requests the file twice; that is harmless, so add no "load once" guard. |
| `src/lib/animation-variants.ts`                       | `fadeInUp` / `fadeInScale(delay, shouldReduceMotion)` keep their signature and callers. When they animate, they also return `'data-entrance': ''`, which the spread passes onto the `m.div`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `src/index.css`                                       | One rule: `[data-motion-failed] [data-entrance] { opacity: 1 !important; transform: none !important; }`. It overrides the inline `opacity: 0` and offset that `m` set at mount. `m` computes its inline style from `initial` once and never recomputes it, so a later flag in props cannot undo it.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Pages and `src/hooks/use-parallax.ts`                 | Unchanged. They keep `useReducedMotion`. Parallax without features simply stays still.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `src/features/templates/pdf/template-viewer.tsx`      | Default export: `PDFViewer` plus `TemplatePDF`. Only reached through `lazy-template-viewer.tsx`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/features/templates/pdf/lazy-template-viewer.tsx` | `React.lazy` plus `Suspense` with a caller supplied `fallback`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `src/features/pdf/pdf-export.tsx`                     | `renderResumePdf(data, templateId, compactScale, lang)` loads `@react-pdf/renderer` and `template-pdf` with `import()`. Both `exportToPDF` and the preview's one page fit search use it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `perf/budgets.json`                                   | New `lazyEngines` list of `{ "match": "<manifest key substring>", "reason": "<non empty>" }`. The `Budgets` type gains `lazyEngines: { match: string; reason?: string }[]`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `scripts/perf/measure-routes.ts`                      | New `checkEngines(manifest, routes, engines)`, called from `checkBudgets`, which gains the manifest as a third argument (`check-bundle-size.ts` already holds it). It returns problems only, no table rows, and never throws.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `eslint.config.js`                                    | The `restrict` helper's rule options become `{ paths: MOTION_BANS, patterns: [noParent, ...bans] }`, so every block carries the ban (ESLint applies the last matching block per rule). `MOTION_BANS` is two entries: `{ name: 'motion/react', importNames: ['motion'], message }` and the same for `framer-motion`. The message is "Use `m` inside LazyMotion, not `motion` (spec 0008)." It applies to test files too. Namespace imports (`import * as`) are out of scope.                                                                                                                                                                                                                                                       |

**Engine leak check** (AC-8). There is no closure math. Shared chunks that routes and engines both use (such as `resume-metadata` or `is-svg-component`) never count as a leak. The steps:

1. `lazyEngines` must be a non empty list, and each entry needs a non empty `reason`. Otherwise it is a problem.
2. For each entry, find every manifest key that contains `match` as a substring. Zero matches is a problem: `lazy engine "<match>" matches no manifest key`. This stops a file rename from quietly switching the check off. If someone imports an engine statically from a single place, rolldown may inline it into the route chunk. The failure then reads "matches no manifest key" instead of naming the route. That is accepted, because the byte budget trips too, and the unit test proves the route naming.
3. The engine's own files are `manifest[key].file` for those matched keys.
4. A route leaks when its first load `files` (from `measureRoutes`) include one of those files. Report each route and file pair once, even when several entries match the same file: `<route>: first load contains lazy engine "<match>" (<file>)`.

The starting list:

| `match`                                          | Engine                                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `react-pdf.browser`                              | The `@react-pdf/renderer` library chunk                                            |
| `src/features/templates/pdf/template-viewer.tsx` | On screen PDF viewer                                                               |
| `src/features/templates/pdf/template-pdf.tsx`    | Template renderers and PDF font registration                                       |
| `pdfjs-dist/build/pdf.mjs`                       | pdf.js. It is a substring because the key carries the pnpm store path and version. |
| `src/lib/motion-features.ts`                     | Motion animation engine                                                            |

**Value sourcing**:

| Action                                   | Value                                                         | Source                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Render an entrance animated element      | Whether to animate at all                                     | Unchanged: the OS reduced motion setting (`useReducedMotion`), passed to `fadeInUp` / `fadeInScale`                                      |
| Render an entrance animated element      | `data-entrance` attribute                                     | Returned by `fadeInUp` / `fadeInScale` whenever they animate                                                                             |
| Motion features fail or stall            | `data-motion-failed` on `<html>`                              | Set by `MotionProvider` when `import('@/lib/motion-features')` rejects (caught in `loadFeatures`) or 8 seconds pass without it resolving |
| Stall timeout                            | 8 seconds                                                     | Decided here: long enough for a slow 3G fetch of a 12 KiB file, short enough that content never looks missing                            |
| Show the PDF on `/preview`               | Document props (`data`, `templateId`, `compactScale`, `lang`) | Unchanged: stored resume, `?templateId=`, the fit search result, `normalizeLang(i18n.language)`                                          |
| Show the PDF on `/templates/$templateId` | Document props                                                | Unchanged: `SAMPLE_RESUMES[templateId][lang]`, `compactScale` 0                                                                          |
| Preview loading state                    | Placeholder                                                   | The existing `preview.title` text, used both before the fit search ends and as the `Suspense` fallback                                   |
| Template page loading state              | Placeholder                                                   | `null`: the page's own decorative background shows through                                                                               |
| Leak check                               | Engine files                                                  | `manifest[key].file` for every key that contains a `lazyEngines` `match`, from `dist/.vite/manifest.json`                                |
| Leak check                               | Route first load files                                        | `MeasuredRoute.files` from `measureRoutes` (spec 0003)                                                                                   |
| Budgets                                  | `maxKb` per route and chunk cap                               | Measured size plus 5% (spec 0003)                                                                                                        |

**Key invariants**:

- No page or shared module imports `@react-pdf/renderer`, `template-pdf.tsx`, `template-viewer.tsx`, `pdfjs-dist` or `motion-features.ts` statically. They are reached only through `import()` or `React.lazy`.
- Pages render `m.*`, never `motion.*`.
- Entrance animations go through the shared variants (which carry `data-entrance`), never an ad hoc `initial` hidden state.
- Content never depends on the motion features file to become visible: within 8 seconds it either animates in or is forced visible.
- Every JS chunk stays in the PWA precache (`globPatterns` `**/*.js`).

**Security model**: no change. The CSP already allows the blob frames and WebAssembly that react-pdf needs, and lazy chunks are same origin scripts under `script-src 'self'`.

**Critical test scenarios**:

- Happy path: `pnpm build && pnpm perf:size` passes with all five engines matched and no leaks. Verifies **AC-1**, **AC-2**, **AC-4**, **AC-8**.
- Leak: a unit test with a synthetic manifest where a route statically imports an engine's own chunk expects a problem naming that route, engine and file. Verifies **AC-8**.
- Shared chunks are not engines: in the synthetic manifest, a chunk that a route and an engine both import statically does not count as a leak. Verifies **AC-8**.
- Guard rails: an engine `match` that hits no key, an empty `lazyEngines`, and an entry with no `reason` each produce their problem. Verifies **AC-8**.
- Fallback: render `MotionProvider` around an `m.div` spread with `fadeInUp(0, false)`, with `@/lib/motion-features` mocked to reject. Expect `document.documentElement` to get `data-motion-failed` and the element to carry `data-entrance`. Vitest fails a run on an unhandled rejection by default, which covers the "no unhandled rejection" part. Verifies **AC-6**.
- Stall: same setup with the import mocked to a promise that never settles, using fake timers. After 8 seconds expect `data-motion-failed`, and expect none when the import resolves first. Verifies **AC-6**.
- CSS override: by hand in the browser, block `motion-features-*.js` in DevTools, load `/`, scroll down, and expect every section visible. jsdom does not apply the stylesheet, so this one is manual (in `verify.md`). Verifies **AC-6**.
- Reduced motion: `fadeInUp(0, true)` returns `{}` (no `data-entrance`, no `initial`). Verifies **AC-5**.
- Lint: `pnpm lint` fails on a scratch file that has `import { motion } from 'motion/react'` (checked by hand, not committed). Verifies **AC-7**.
- Offline: the `verify.md` offline steps. Verifies **AC-3**.

## Build plan

Tracer Bullet: tasks 1 to 5 shipped as one end to end slice on 2026-11-05. Tasks 6 to 8 harden it, and each one lands on its own and green.

1. [x] `renderResumePdf` helper; `exportToPDF` and the preview fit search use it. Satisfies **AC-2**, **AC-3**
2. [x] `template-viewer.tsx` plus `lazy-template-viewer.tsx`; `/preview` and the template page use them. Satisfies **AC-2**
3. [x] `motion-features.ts`, `MotionProvider` (`LazyMotion strict`) in `root-layout.tsx`, `motion.*` to `m.*` in every page. Satisfies **AC-1**, **AC-5**, **AC-7**
4. [x] Drop the `motion` `manualChunks` rule in `vite.config.ts`. Satisfies **AC-1**
5. [x] Lower `perf/budgets.json` to the measured sizes plus 5%. Satisfies **AC-4**
6. [x] Load failure fallback: `data-entrance` from `fadeInUp` / `fadeInScale`, the `[data-motion-failed] [data-entrance]` rule in `src/index.css`, and in `MotionProvider` the in component `loadFeatures` with `.catch` on the `import()`, the 8 second stall timer, and the effect that sets `data-motion-failed`. Add the fallback, stall and reduced motion tests, and the manual blocked file step to `verify.md`. Satisfies **AC-5**, **AC-6**
7. [x] Lint guard: `MOTION_BANS` as `paths` in the `restrict` helper of `eslint.config.js`. Check by hand that a scratch `import { motion } from 'motion/react'` fails `pnpm lint`. Satisfies **AC-7**
8. [x] Engine leak check: `lazyEngines` in `perf/budgets.json` and the `Budgets` type, `checkEngines` in `measure-routes.ts`, the manifest passed into `checkBudgets` from `check-bundle-size.ts`, and the unit tests. Satisfies **AC-8**

## Consequences

**Positive**:

- `/preview` dropped from 562 KiB to 179 KiB and `/templates/$templateId` from 565 KiB to 190 KiB. Every other page lost about 19 KiB.
- The PDF pages show their frame at once instead of waiting for the engine.
- The leak check and lint rule turn the invariants into CI failures instead of code review reminders.

**Negative / tradeoffs**:

- Below the fold entrance animations depend on a second request. On a cold, slow connection an element can sit hidden for up to 8 seconds before the stall fallback shows it.
- The fallback is a CSS `!important` override that bypasses motion. It is a deliberate escape hatch, used only after motion has failed or stalled.
- The `m` shell and scroll hooks (about 18 KiB) stay in every first load. "No animation engine" means the engine, not every byte of motion.
- The PDF arrives after the page shell, so the PDF itself is not faster to appear; only the page frame is. No prefetch was added, by choice.
- `m` drops support for features outside `domAnimation` (layout animations, drag). Using one later means switching the features to `domMax` (larger) or loading it per page.
- The `radix` manual chunk still captures React. This costs no bytes today, but the chunk name is misleading.

**Neutral**:

- New convention: pages use `m`, and entrance animations go through the shared variants.
- The landing is rebuilt in feature 12. That build must keep these rules, and the leak check and lint rule enforce them.

## Follow-up

- [ ] The `radix` `manualChunks` rule captures React (the motion features chunk imports from it). Consider a `react` vendor chunk or dropping `manualChunks`, then measure again.
- [ ] Run `pnpm perf:lighthouse` to confirm the Lighthouse floors still hold, mainly the landing performance floor (0.98), now that entrance animations wait for a second file.
- [ ] `src/features/templates/pdf/AGENTS.md` says `preview-page.tsx` imports react-pdf dynamically. It now goes through `renderResumePdf` and `LazyTemplateViewer`. The `m` and shared variant conventions belong in root `AGENTS.md` under Animations.
