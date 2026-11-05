# 0009. Builder responsiveness: rationale

## Context

> ⚠️ Premise note: the scope row asked for a smoother builder and spoke of "the live preview", but the builder has no live preview; the preview is the separate `/preview` page. You chose to add one, which turns a tuning task into a tuning task plus a new feature, with an engine (react-pdf in a Web Worker) this project has not run before. Two things keep that safe: the build proves the worker first and stops if it fails (Build plan step 2), and the form fixes stand on their own, so they ship even if the preview does not.

The builder is one TanStack Form (spec 0005). The sections get the form through `withForm`, and fields follow their own values. Three things cost work on every keystroke. Each list section (experience, education, languages, skills, interests) subscribes to its whole array, because an array field skips `form.reset`. Typing in one experience card makes a new `experiences` array, so every experience card and the drag and drop wrapper render again. The React Compiler cannot skip items inside a `map`. The form also validates the whole resume with Zod (`validators: { onChange: resumeFormSchema }`) on every change. Spec 0005 left the array subscription as a known target for this feature.

Autosave already runs off the keystroke path: a 30 second interval that compares JSON before writing. The scope's "autosave never runs on every keystroke" already holds. Its gap is the other way: up to 30 seconds of typing is lost when the tab closes.

There is no measurement yet. Spec 0003's builder profile (build task 5) was skipped, and the perf fixture is the short sample resume (2 jobs, 1 school), not a long one. So any claim about dropped frames needs a fixture and a recorded profile first.

A live preview runs into react-pdf's cost. Laying out a long resume takes roughly 100 to 500ms, and on the main thread that freezes input for the whole render. The existing on screen viewer (`PDFViewer`) is an iframe that reloads on every change, and many phone browsers will not show a PDF inside an iframe. The page budgets (spec 0003) and the lazy engine rule (spec 0008) forbid react-pdf in any page's first load, `/builder` included. The CSP already allows same origin and blob workers.

## Options considered

### Option 1: Fix the form in place only

Make lists follow their length, flush autosave on hide, measure before and after. No live preview.

**Pros**:

- Small, low risk, done in a few commits; meets the scope's done line.
- No new engine on `/builder`.

**Cons**:

- No live preview; you keep switching to `/preview` to check the layout, which is the part you asked for.

### Option 2: Fix in place, plus a live preview built in a worker and drawn with pdf.js (chosen)

The form fixes from Option 1, plus a panel (a sheet on phones) whose PDF is built by react-pdf in a dedicated module worker, 700ms after typing stops, newest values winning. pdf.js (already in the app for import) draws the pages to canvases, swapping them only when all are ready.

**Pros**:

- React-pdf layout never touches the input thread, so the preview truly cannot block typing.
- Canvas pages work on phones, do not flash, and keep scroll.
- Same `TemplatePDF` as export, so the preview matches the download.

**Cons**:

- react-pdf in a worker is unproven here; it needs a go or no go step.
- A second copy of react-pdf in the worker bundle, outside the page budgets.
- More moving parts: worker, protocol, client, canvas drawing.

### Option 3: Fix in place, plus a main thread preview through the existing viewer

Render with `PDFViewer` (or `renderResumePdf` into an iframe) after a debounce, scheduled in idle time.

**Pros**:

- Least new code; reuses `LazyTemplateViewer` and `renderResumePdf`.

**Cons**:

- A render that starts just before you type again blocks input for its full length, which breaks the goal of the feature.
- The iframe reloads and flashes on every update and fails on many phones.

### Option 4: Split the builder into one form per section

Each section owns its own form, so a keystroke can only touch its section.

**Pros**:

- Strongest isolation, with no subscription tuning.

**Cons**:

- Submit, progress, reset, import and autosave must gather seven forms, and the one resume schema splits; spec 0005 rejected this for those reasons.
- The length subscription gets the same isolation for a fraction of the change.

## Rationale

The scope's goal is input that never waits. Option 1 gets the form there cheaply, and every other option includes it. You also asked for a live preview, and once a preview exists, where it renders decides whether the goal holds. react-pdf's layout is synchronous and long on a long resume. On the main thread (Option 3) no debounce can stop it from colliding with the next keystroke. A worker is the only placement where the claim "preview never blocks input" is true by construction. pdf.js already runs its parsing in its own worker and paints in short chunks, and the iframe viewer fails on phones and flashes. So drawing to canvas is the display that fits the worker.

The risk sits in one place, so the plan tests it first. If react-pdf cannot run in a module worker, step 2 stops and the decision comes back here. The fallback is then a choice between Option 3 and dropping the preview, not a silent switch.

For the form, following only the list length beats a reset counter. Each field already follows its own value through `form.AppField`, so reset and import reach every field without a forced redraw, and the 0005 characterization suite proves it. Validation stays as it is. Zod 4 checks a resume this size quickly, and moving to field level checks would change how `isValid`, `canSubmit` and "errors only after touch" behave. The before profile decides, with a 2ms bar. Autosave keeps its interval because it is already off the keystroke path. Saving on `pagehide` and on hidden `visibilitychange` closes the real gap, the edits lost on close, with one effect.

### Smaller calls made while writing

- **Imperative store subscription for the preview** (`form.store.subscribe` in an effect): no React render per keystroke for the panel. Runner up: `useStore` with a selector, which renders the hook host on every edit.
- **Coalescing lives in the client, not the worker**: one busy flag and one pending slot, testable with a fake worker. Runner up: a queue in the worker, which can only be tested through a real worker.
- **Ready handshake with a 20 second timeout**: the worker posts `ready` once react-pdf has loaded, so a script that never arrives (offline, before caching) becomes "unavailable" instead of a forever spinner. Twenty seconds covers a slow 3G download of the worker bundle.
- **Open preview button runs the normal submit**: `/preview` reads the saved resume, so the button must save first; reusing `form.handleSubmit` keeps the 30% gate and validation the same. Runner up: a plain link, which would open `/preview` with stale or no data.
- **Worker and drawing code under `src/features/pdf/live-preview/`**: the pdf area owns render engines, and the builder page area may import it (spec 0002). The UI stays in `src/features/builder/live-preview/`.
- **Render count tests by wrapping the real card components** (`vi.mock` with `importActual`): no test only code in production files. Runner up: `<Profiler>` wrappers in the cards.
- **Worker kept alive while hidden**: reopening the panel renders at once. Runner up: terminating on hide, which redownloads nothing but pays the engine start again.

## Baseline

To be filled in by Build plan steps 1 and 11 (`pnpm preview`, `long-resume.json`, Chrome DevTools Performance, 4x CPU slowdown, 20 characters typed into experience 3's description).

| Run                             | Longest main thread task | Tasks over 50ms | Zod time per keystroke | Notes                                                                             |
| ------------------------------- | ------------------------ | --------------- | ---------------------- | --------------------------------------------------------------------------------- |
| Before (compiler on)            | 29.7 ms                  | 0               | 0.07 ms                | 3 runs: 27.2, 29.6, 29.7 ms longest                                               |
| After, panel open               | 38.0 ms                  | 0               | 0.06 ms                | 2 runs: 38.0, 32.6 ms longest; the preview redrew in each run                     |
| After, panel open, compiler off | 87.6 ms                  | 2               | n/a                    | information only; 2 runs: 59.1, 87.6 ms longest, the long tasks are React renders |

How the numbers were taken (2026-11-05): an automated stand in for the DevTools recording, driven through Playwright on Chromium (Apple silicon), `pnpm build` then `vite preview`, viewport 1440 by 900, the long fixture in `resumeData`. CDP `Emulation.setCPUThrottlingRate` 4, a `devtools.timeline` trace while typing 20 characters into experience 3's description (120ms between keys) plus 3 seconds after. "Longest task" is the longest `RunTask` on the renderer main thread. Zod time is `resumeFormSchema.safeParse` on the long fixture, averaged over 50 runs at 4x, from a small bundle that imports the real schema. Zod is far under the 2ms bound, so AC-4 does not trip and validation stays form level.

The after runs type the same 20 characters with the panel open and wait 6 seconds, so each trace holds the 700ms wait, the worker render and the page draw (the test checks the canvases were replaced). A first after run showed 54 to 107ms tasks: every update added and removed the PDF's fonts in `document.fonts`, which laid out the whole builder page (2,529 layout objects) twice. `loadPdf` now passes `disableFontFace: true` (pdf.js draws glyphs as paths), the panel has `contain: strict` and no backdrop blur, and each page sits in a `content-visibility: auto` box; with that no task goes over 50ms. The compiler off build was made once by dropping the compiler preset from `react-plugins.ts` locally and was not kept.

Worker bundle (2026-11-05): one file, `assets/preview-worker-*.js`, 1,241,983 bytes raw (1.18 MiB), 364,988 bytes brotli. It is under the 3 MB precache limit and is listed in `dist/sw.js`, with the PDF fonts. Offline check in Chromium (Playwright, `setOffline`): after one online visit, reload `/builder` offline, the panel drew in under a second and redrew after typing. Offline check in Safari 27.0.1 (macOS, real Safari through `safaridriver`, 1440 by 900): after one online visit the service worker controlled the page and its cache held the preview worker; then the `vite preview` server was stopped (Safari has no scriptable offline switch, so an unreachable server stands in), `/builder` was reloaded, the panel drew 4 pages in about a second, and typing into first name redrew all pages in about 1.5 seconds with no notice.
