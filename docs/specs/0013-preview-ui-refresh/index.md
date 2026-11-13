# 0013. Preview UI refresh: token chrome, a page strip, and the builder's worker drawing the pages

**Date**: 2026-11-13
**Status**: In Progress

## Summary

This spec moves the `/preview` page onto the app's design tokens, in the same calm style as the gallery and the builder: a solid sticky toolbar, no gradients or glass blur. The resume is no longer drawn in a browser PDF frame (an `iframe`), which many phones cannot show. Instead the page reuses the builder's preview worker (a background thread that makes the PDF) and draws each page on a canvas, so it works on phones and never freezes the page. A small strip under the toolbar shows the page count and, when it helps, a Full size / One page switch; Download saves exactly the PDF you see. The resume itself, the templates and the saved data do not change.

## Requirements

**User stories**:

- As a job seeker on a phone, I want to see my resume on `/preview`, so that I can check it before I download it.
- As a job seeker with a two page resume, I want to know whether it can fit on one page and switch between the two, so that I can pick the version I send.
- As anyone downloading, I want the file I get to be exactly what I saw, without waiting for it to be made again.
- As a keyboard or screen reader user, I want every control in the toolbar and strip to be reachable and announced, so that I can preview and download without a mouse.
- As someone who opened `/preview` with nothing saved, I want a clear way to start, so that I am not stuck on an empty page.

**Acceptance criteria**:

_Page shell and toolbar_

- **AC-1**: The `/preview` root is `bg-background min-h-screen` with `data-preview-page` and no `overflow` class on it or on any ancestor it adds, so `sticky` works. The window scrolls the page (no `h-screen` frame with inner scroll). Every `bg-linear-*`, `bg-gradient-*`, `bg-clip-text` gradient, `backdrop-blur`, `animate-gradient-shift`, `animate-fade-in-up`, the dot pattern and every raw palette class (`slate-*`, `gray-*`, `indigo-*`, `violet-*`, `green-*`, `orange-*`) are gone from the page.
- **AC-2**: `src/features/preview/**/*.{ts,tsx}` is in `TOKEN_ONLY_FILES` and imports nothing from `motion/react`. `pnpm lint` passes.
- **AC-3**: The toolbar is `sticky top-0 z-10`, 56px high (`h-14`), solid `bg-background` with a bottom border. Left to right: the edit link, the `h1`, then, pushed right: Download PDF, `LanguageToggle`, `ThemeToggle`.
- **AC-4**: One edit link replaces both Back to editor and Edit CV. It goes to `/builder` with `search={{ templateId }}` (the resolved id from AC-21), shows a pencil icon plus `preview.editCv` from `sm` up and only the icon below that, and its accessible name is `preview.editCv` at every width.
- **AC-5**: The page has exactly one `h1` (`preview.title`), in the toolbar, visible from `md` up and `sr-only` below that. It uses `font-display` and no gradient.
- **AC-6**: Download PDF is the only `variant='default'` button on the page. It shows its icon plus `preview.downloadPdf` from `sm` up and the icon only below that, with the accessible name `preview.downloadPdf` at every width. It keeps `data-testid='export-pdf'` (the Lighthouse seed script waits for it).
- **AC-7**: At 320px wide the page has no sideways scroll, in EN and PL, with the toolbar on one row.

_Drawing the pages_

- **AC-8**: The pages are drawn by the spec 0009 preview worker through `createPreviewClient`, and shown as canvases by the shared `PreviewPages` component. `/preview` mounts no `iframe` and no `PDFViewer`. `template-viewer.tsx` and `lazy-template-viewer.tsx` are deleted, along with their `lazyEngines` entry in `perf/budgets.json`.
- **AC-9**: The page area is `bg-muted` with the pages centered, each page `bg-paper shadow-surface ring-1 ring-border`, filling the available width up to 900px (`MAX_PAGE_CSS_WIDTH`). Pages stay white in dark mode. Resizing the window redraws them at the new width, as in the builder. Each canvas has `role='img'` and the name `pdfPreview.pageLabel` with its page number and total.
- **AC-10**: Until the first render lands, the page area shows one blank `bg-paper` sheet at A4 ratio (1 : 1.4142) and the width a page will have, plus a `role='status'` line with `pdfPreview.preparing`. The sheet is CSS only (`w-full max-w-[900px] aspect-[1/1.4142] bg-paper`), owned by `preview-area`. Nothing animates. When the pages land, the sheet is replaced in place with no visible jump (a pixel or two of rounding is accepted).
- **AC-11**: On the happy path (the worker starts, renders succeed, Download saves on screen bytes), the `@react-pdf/renderer` chunk is never requested by the main thread. `pnpm perf:size` passes with `/preview` within its current budget and no `lazyEngines` chunk in its first load; the pdf.js chunk (`getPdfjs`) stays lazy too. The AC-20 fallback may load react-pdf on the main thread; that path is outside this criterion.

_Page strip, one page fit and modes_

- **AC-12**: Below the toolbar, a strip 44px high (`h-11`), solid `bg-background` with a bottom border, `md:sticky md:top-14 md:z-10`, scrolling away with the page below `md`. It holds a status text in an always mounted `role='status'` element and, when AC-14 allows, the mode switch.
- **AC-13**: Before the first render lands, the status text is empty (the element stays mounted). After the first render, the status shows the page count of the version on screen (`preview.pageCount`, plural aware). For a resume over one page, while the fit search runs it shows `preview.fit.checking` next to the count. If no compact scale fits on one page, it shows `preview.fit.tooLong` next to the count, and no switch. If the fit search fails, the status shows only the count, and no switch.
- **AC-14**: The mode switch is the existing `SegmentedControl` (`size='sm'`), named `preview.mode.label`, with two items: `preview.mode.full` (value `full`) and `preview.mode.onePage` (value `onePage`). It renders only when the full size version has more than one page and the fit search found a scale that fits. Space for it is reserved from the first render of a multi page resume until the search ends, so the strip does not shift when it appears.
- **AC-15**: The fit search finds the smallest `compactScale` (0 to 1) that renders to one page, with the same rule as today: render at scale 1 first, stop with "too long" if that is still over one page, then six halving steps (precision 1/64), keeping the upper bound. Every trial render goes to the preview worker, one at a time; pages are counted with pdf.js on the main thread. Trial renders are never drawn on screen. A trial whose render fails, or whose page count errors or comes back 0, is a failed trial and ends the search with `fit: 'failed'`. The whole search is capped at 60 seconds; past the cap it ends with `fit: 'failed'` and any late result is dropped.
- **AC-16**: Full size is selected by default on every visit and after every language change. The choice is not stored.
- **AC-17**: The page keeps the bytes of the full size render and of the render at the winning scale. Switching modes draws the kept bytes for that mode without asking the worker again, and the status shows that version's page count.
- **AC-18**: Changing the language while on `/preview` renders the full size version again in the new language, resets the mode to Full size, hides the switch and runs the fit search again. At the start of the new run the kept bytes are cleared, the old pages stay on screen unchanged until the new ones land, and Download uses the AC-20 fallback until then. The new full size render waits for any trial already in flight to finish (up to its 30 second timeout), so the old pages can stay that long. Results from a run that a language change overtook are ignored and never drawn or downloaded.

_Download_

- **AC-19**: When the bytes for the selected mode are kept, Download PDF saves those exact bytes as `application/pdf` at once, with the name from `generateResumeFilename(firstName, lastName)`. No new render happens.
- **AC-20**: When those bytes are not available (before the first render lands, the worker is unavailable, or the last render failed), Download calls `exportToPDF` with the selected mode's scale (0 for Full size), as today. While that export runs the button is disabled, sets `aria-busy`, swaps its icon for a spinner and keeps its label, so the toolbar does not shift.

_Template choice_

- **AC-21**: `/preview` gets a zod free `validateSearch` (`validatePreviewSearch` in `src/features/preview/preview-search.ts`, the same shape as `builder-search.ts`) that keeps `templateId` only when `isTemplateId` passes. The template used is the search `templateId`, else the saved resume's `templateId` when `isTemplateId` passes, else `developer`. The page reads it without an `as` cast.

_Failure and empty states_

- **AC-22**: When the worker reports `unavailable` (start timeout, start error or crash), the page latches unavailable until reload, even if a late `ready` follows. If nothing is drawn yet, the page area shows a `role='status'` notice `preview.unavailable` on `bg-muted` tokens, the strip shows no count and no switch, and Download works through AC-20. If pages are already drawn, they and their kept bytes stay, Download still saves them (AC-19), the count stays, and only the switch is dropped (a running search ends with `fit: 'failed'`).
- **AC-23**: When the full size render fails (the worker answers `failed` or the 30 second render timeout passes), the page area shows a warning notice `preview.renderFailed` (`border-warning/40 bg-warning/10`, `role='status'`) with a `preview.retry` button. Try again resets `fit` to `idle`, sends the full size request again and, on success, draws the pages and runs the fit search. If a trial render fails during the fit search, the full size pages stay and only the switch is dropped (AC-13).
- **AC-24**: A failed `exportToPDF` opens the existing export error `AlertDialog` with the same copy (`preview.exportErrorTitle`, `preview.exportError`), restyled with tokens only (icon chip `bg-warning/10 text-warning`, no raw colors). When it closes by button or Escape, focus returns to Download PDF.
- **AC-25**: With no saved resume, the page shows the toolbar with only the `h1`, `LanguageToggle` and `ThemeToggle` (no edit link, no Download, no strip), and below it a card (`bg-card border rounded-xl shadow-surface`) with an `h2` `preview.noData`, the hint `preview.noDataHint`, a primary link `preview.startBuilding` to `/builder` with the resolved `templateId`, and an outline link `preview.chooseTemplate` to `/templates`. No worker is started: the empty state and the full page are separate components, and only the full page calls `usePreviewDocument` (no conditional hook call).

_Copy and guards_

- **AC-26**: Every new string goes through `t()` and lands in both `src/locales/en` and `src/locales/pl` (see Copy). Keys no code reads any more are removed from both files.
- **AC-27**: Every control in the toolbar, strip, notices and dialog is reachable by keyboard in visual order, with a visible focus ring. The mode switch moves with the arrow keys (radio group). Each interactive target is at least 24 by 24 CSS pixels.
- **AC-28**: In the builder, the live preview looks and behaves as on `main` after `PreviewPages` moves: same page count line, same full size hint, same notices.
- **AC-29**: `pnpm pre-commit` passes, and `pnpm perf:lighthouse` scores `/preview` 95 or more in every category, in light and dark.

## Decision

**Chosen option**: Option 1: Refresh the chrome and draw with the builder's worker

Rebuild the `/preview` chrome on tokens, draw the pages with the spec 0009 worker and the shared canvas `PreviewPages`, run the one page fit search through that worker, and download the bytes on screen. This closes the deferred "One PDF viewer" item from spec 0011: `/preview` joins the builder on the canvas engine, the gallery detail page keeps its `BlobProvider` iframe from `lg` up.

**Implementation skills**: `tanstack-router` (`tanstack-skills/tanstack-skills`, `.agents/skills/tanstack-router/`) · `react-pdf` (`molefrog/skills`, `.agents/skills/react-pdf/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

## Feature design

**Design source**: the current app UI. `DESIGN.md` plus the shipped gallery (spec 0011) and builder (spec 0012). No design tool and no new token.

**Data model**: none. No stored shape, schema rule or storage key changes. The mode choice is in memory only.

### Components

All in `src/features/preview/` unless noted. Each file stays small; the page file only composes.

| File                                              | Owns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preview-search.ts`                               | `validatePreviewSearch` (AC-21), wired in `src/routes/preview.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `preview-page.tsx`                                | Loads the saved resume once, resolves the template, picks empty state or the full page, composes the parts below                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `preview-toolbar.tsx`                             | Edit link, `h1`, Download, toggles (AC-3 to AC-6). Takes `showActions` so the empty state can hide the edit link and Download                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `preview-strip.tsx`                               | Status text and the `SegmentedControl` (AC-12 to AC-14)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `preview-area.tsx`                                | Picks loading sheet, unavailable notice, failure notice with Try again, or `PreviewPages` (AC-9, AC-10, AC-22, AC-23)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `preview-empty-state.tsx`                         | The no data card (AC-25)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `export-error-dialog.tsx`                         | The token only `AlertDialog` (AC-24)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `use-preview-document.ts`                         | The engine hook: worker client, full size render, fit search, kept bytes per mode, status, retry (AC-8, AC-13, AC-15, AC-17, AC-18, AC-23)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `use-download.ts`                                 | Save kept bytes or fall back to `exportToPDF`, busy and error state (AC-19, AC-20, AC-24)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `find-one-page-scale.ts`                          | The pure binary search, today's `findMinCompactScale`, taking `render(scale) => Promise<{ pdf: ArrayBuffer; pages: number }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | null>`and returning the winning scale plus its bytes,`'too-long'`, or `null` on a failed trial. Unit tested without a worker |
| `src/features/pdf/live-preview/preview-pages.tsx` | Moved from `src/features/builder/live-preview/`. Draws pages plus its own notices (`pdfPreview.preparing`, `builder.livePreview.updateFailed` becomes `pdfPreview.updateFailed`, canvas names `pdfPreview.pageLabel`). New prop `showNotices` (default `true`): `/preview` passes `false` and never passes `renderFailed`, so `preview-area` owns every notice and the strip is the only status for counts. The page count line and the full size hint move into the builder's `LivePreviewBody`, fed by a new `onPageCount(count: number)` prop that fires after each canvas swap and with 0 on unmount. The builder uses it; `/preview` ignores it and reads `shown.pages` (AC-28). Canvas names are set at draw time, so after a language change they update with the next draw |

### Engine hook

`usePreviewDocument({ data, templateId, lang })` returns:

```ts
type PreviewDocument = {
    status: 'starting' | 'rendering' | 'ready' | 'failed' | 'unavailable';
    fit: 'idle' | 'checking' | 'fits' | 'too-long' | 'failed';
    mode: 'full' | 'onePage';
    setMode: (mode: 'full' | 'onePage') => void;
    shown: { pdf: ArrayBuffer; pages: number } | null; // the kept bytes for the selected mode
    scale: number; // 0 for full, the winning scale for onePage
    retry: () => void;
};
```

- **Client lifetime.** It holds the client in a ref, created lazily, and disposes it through the same deferred dispose `use-live-preview.ts` uses (a `setTimeout(0)` that a remount clears), so StrictMode's mount, unmount, mount does not start a second worker. `onResult` and `onStatus` are registered once per client; the run id guard covers the replayed effect.
- **`renderOnce(input): Promise<PreviewResult>`** wraps the client. **Only one request is ever outstanding.** The client keeps a single waiting slot and calls one result callback with no request id, so a second request sent while one is in flight would pair results with the wrong caller. It settles as follows:
    - A result with a waiter resolves that waiter.
    - A result with no waiter (a late answer after the client's 30 second timeout, or after the search was abandoned) is dropped.
    - Status `unavailable`, and dispose, resolve any waiter with `{ ok: false }` and make every later call resolve `{ ok: false }` at once.
- **Runs.** A new run (language change, retry) first awaits the in flight promise and throws its result away. Each run takes a run id; any await that returns with an older run id stops without touching state (AC-18). At run start the kept bytes are cleared and `status` becomes `rendering`, but the drawn pages stay until new bytes are shown.
- **Order of a run.** Full size render at scale 0, count pages, set `shown` and `status: 'ready'`. If pages > 1, set `fit: 'checking'` and call `findOnePageScale` under the 60 second cap, passing a `render` that calls `renderOnce` and counts pages, returning `null` on a failed render or a count that errors or is 0. `findOnePageScale` starts with the scale 1 trial as the current winner and replaces the winning scale and its buffer together each time a trial fits, so the bytes kept always belong to the returned scale. Every other trial buffer is dropped at once.
- **Page counting** uses pdf.js through `getPdfjs()` on a copy (`pdf.slice(0)`), never the kept buffer: pdf.js takes ownership of the bytes it gets (PDF context file). Add a sibling `countPdfBytes(pdf: ArrayBuffer): Promise<number | null>` that returns `null` on a parse error, rather than the 1 `countPdfPages` returns, so a broken PDF never counts as fitting.
- **Unavailable** is latched: the first `unavailable` status sets `status: 'unavailable'` for the rest of the page's life, even if the client later reports `ready`. Drawn pages and kept bytes stay (AC-22).
- **Inputs.** The hook takes `data`, `templateId` and `lang` as effect dependencies. `lang` comes from `useTranslation`, so a language change renders the page again and starts a new run. `data` is loaded once with `useState(loadStoredResume)`, so its identity never changes.
- The input is `{ data, templateId, compactScale, lang }` (`TemplatePdfInput`). `toPreviewInput` stays builder only.

### Layout

- Toolbar: `sticky top-0 z-10 h-14 border-b bg-background`, inner row `mx-auto flex h-full max-w-6xl items-center gap-2 px-4`. The `h1` follows the edit link; Download, Language and Theme sit in an `ml-auto` group.
- Strip: `h-11 border-b bg-background md:sticky md:top-14 md:z-10`, same inner width, status left, switch right. Below `md` the status can truncate (`truncate min-w-0`) but the switch never shrinks (`shrink-0`).
- Page area: `bg-muted` filling at least the rest of the viewport, `px-4 py-6 md:py-8`, pages in a centered column with `gap-4`, bottom padding so the last page is clear of the viewport edge.
- `html` `scroll-padding-top` is not needed: the page has no in page links.

### Copy

New keys, in both locale files:

| Key                                                   | EN                                                                      | PL                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| `preview.mode.label`                                  | Page layout                                                             | Układ stron                                                  |
| `preview.mode.full`                                   | Full size                                                               | Pełny rozmiar                                                |
| `preview.mode.onePage`                                | One page                                                                | Jedna strona                                                 |
| `preview.fit.checking`                                | Checking if it fits on one page…                                        | Sprawdzam, czy zmieści się na jednej stronie…                |
| `preview.fit.tooLong`                                 | Too long for one page                                                   | Za długie na jedną stronę                                    |
| `preview.pageCount_one` / `_few` / `_many` / `_other` | {{count}} page / pages                                                  | {{count}} strona / strony / stron / strony                   |
| `preview.renderFailed`                                | The preview could not be drawn                                          | Nie udało się narysować podglądu                             |
| `preview.retry`                                       | Try again                                                               | Spróbuj ponownie                                             |
| `preview.unavailable`                                 | The preview can't show in this browser. You can still download the PDF. | Podgląd nie może się tu wyświetlić. Nadal możesz pobrać PDF. |
| `preview.chooseTemplate`                              | Choose a template                                                       | Wybierz szablon                                              |
| `pdfPreview.preparing`                                | Preparing preview… (moved from `builder.livePreview.preparing`)         | as today                                                     |
| `pdfPreview.updateFailed`                             | moved from `builder.livePreview.updateFailed`                           | as today                                                     |
| `pdfPreview.pageLabel`                                | moved from `builder.livePreview.pageLabel`                              | as today                                                     |

EN only plural forms are `_one` and `_other`. Removed when no code reads them: `preview.loadingPreview`, `preview.multiPage`, `preview.singlePage`, `preview.exporting`, `preview.success.*`, `preview.contentWarning.*`, and `nav.backToEditor` if nothing else uses it. Existing keys reused unchanged: `preview.title`, `preview.editCv`, `preview.downloadPdf`, `preview.noData`, `preview.noDataHint`, `preview.startBuilding`, `preview.exportError`, `preview.exportErrorTitle`, `dialogs.pdfError.ok`.

**Value sourcing**:

| Action                       | Value produced or displayed | Source                                                                                               |
| ---------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| Load page                    | Resume data                 | `loadStoredResume()` once on mount, as today                                                         |
| Load page                    | Template id                 | search `templateId` (validated), else saved `templateId` if `isTemplateId`, else `developer` (AC-21) |
| Load page                    | Language                    | `normalizeLang(i18n.language)`                                                                       |
| Full size render             | PDF bytes                   | worker result for `{ data, templateId, compactScale: 0, lang }`                                      |
| Status text                  | Page count                  | pdf.js count of a copy of the shown bytes                                                            |
| Fit search                   | Winning scale and its bytes | `findOnePageScale` over worker renders (AC-15)                                                       |
| Strip                        | Whether the switch shows    | full size pages > 1 and `fit === 'fits'` (AC-14)                                                     |
| Mode switch                  | Selected mode               | in memory state, `full` on mount and on language change (AC-16, AC-18)                               |
| Download (kept)              | File bytes                  | `shown.pdf` for the selected mode (AC-19)                                                            |
| Download (fallback)          | Scale                       | `0` for Full size, the winning scale for One page (AC-20)                                            |
| Download                     | File name                   | `generateResumeFilename(personalInfo.firstName, personalInfo.lastName)`                              |
| Edit link and Start building | `templateId` search         | the resolved template id                                                                             |
| Canvas name                  | Page number and total       | index in the drawn list and its length                                                               |

**Key invariants**:

- At most one worker request is outstanding at any time.
- What Download saves from kept bytes is byte for byte what is drawn for the selected mode.
- A run overtaken by a language change never draws, counts toward the strip or downloads.
- The kept buffers are never handed to pdf.js; it only ever gets copies.
- The resume pages are white (`bg-paper`) in both themes, and the template PDFs are untouched (`pnpm templates:previews --check` passes with no change).
- No `@react-pdf/renderer`, `template-pdf.tsx` or viewer import is static in page code (spec 0008).

**Security model**: not applicable. Resume data stays in the browser; the worker is the same one `/builder` already runs under the current CSP. No CSP change.

**Configuration required**: none.

**Critical test scenarios** (Vitest, with a fake `PreviewClient` and a fake page counter where noted):

- Happy path, one page resume: pages drawn, status "1 page", no switch, Download saves the kept bytes with the right name and never calls `exportToPDF`. Verifies **AC-8**, **AC-13**, **AC-14**, **AC-19**.
- Two page resume that fits: status shows checking, then the switch appears; choosing One page draws the winner's bytes without a new request; Download saves those. Verifies **AC-13**, **AC-14**, **AC-17**, **AC-19**.
- Too long: scale 1 still gives two pages; status shows too long, no switch. Verifies **AC-13**, **AC-15**.
- `findOnePageScale` unit tests: same scale as today's function for a fixed fake page curve, `'too-long'` at scale 1 overflow, `null` on a failed trial. Verifies **AC-15**.
- Language change mid search: the old run's late result is ignored, mode resets to Full size, a fresh search runs. Verifies **AC-16**, **AC-18**.
- One request at a time: the fake client never sees a second `request` before the first result. Verifies the invariant behind **AC-15**, **AC-18**.
- Worker unavailable before the first render: notice shows, Download calls `exportToPDF` with scale 0. Verifies **AC-20**, **AC-22**.
- Worker crash mid search: the pending trial settles as failed, `fit` becomes `failed`, drawn pages stay, Download saves the kept bytes; a later `ready` changes nothing. Verifies **AC-13**, **AC-19**, **AC-22**.
- Late result after a timeout with nothing waiting is dropped and never drawn. Verifies **AC-15**, **AC-23**.
- A page count error on a trial ends the search as failed, not as fitting. Verifies **AC-15**.
- StrictMode mount creates one worker client. Verifies the client lifetime rule behind **AC-8**.
- Render failure then Try again: failure notice, retry draws pages. Verifies **AC-23**.
- Export failure: dialog opens with the copy, closing returns focus to Download. Verifies **AC-24**.
- No saved resume: empty card, links go to `/builder?templateId=…` and `/templates`, no client created. Verifies **AC-25**.
- Search: an unknown `templateId` falls back to the saved one, then `developer`. Verifies **AC-21**.
- Builder live preview tests still pass after the move. Verifies **AC-28**.

## Build plan

Tracer Bullet: the first task already replaces the iframe end to end, so the page ships after every step.

1. Thin thread. Add `validatePreviewSearch` and the template resolve. Move `PreviewPages` to `src/features/pdf/live-preview/` with the `pdfPreview.*` keys and the `onPageCount` prop, keeping the builder's look. Add `usePreviewDocument` with the full size render only, and a token toolbar (edit link, `h1`, Download from kept bytes with the AC-20 fallback, toggles) over a `bg-muted` page area. Delete `template-viewer.tsx`, `lazy-template-viewer.tsx` and the budgets entry. Satisfies **AC-1**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-8**, **AC-9**, **AC-11**, **AC-19**, **AC-20**, **AC-21**, **AC-28**.
2. Fit and modes. Extract `findOnePageScale`, run it through the worker with one request at a time and run ids, keep both buffers, add the strip with status, reserved space and `SegmentedControl`. Satisfies **AC-12**, **AC-13**, **AC-14**, **AC-15**, **AC-16**, **AC-17**, **AC-18**, **AC-19**.
3. States. Loading sheet, unavailable notice, failure notice with Try again, token export error dialog with focus return, empty state card. Satisfies **AC-10**, **AC-20**, **AC-22**, **AC-23**, **AC-24**, **AC-25**.
4. Guards and cleanup. Add `src/features/preview/**` to `TOKEN_ONLY_FILES` and the `motion/react` import ban, remove dead keys in both locales, check 320px in EN and PL, keyboard pass, then `pnpm pre-commit` and `pnpm perf:lighthouse`. Satisfies **AC-2**, **AC-7**, **AC-26**, **AC-27**, **AC-29**.

## Consequences

**Positive**:

- `/preview` works on phones, which today often show an empty frame.
- The page never freezes during the fit search; up to seven trial renders move off the main thread.
- Download is instant and always matches the screen, and react-pdf leaves the page's main thread on the happy path.
- Builder and preview share one drawing engine, so a fix to one is a fix to both, and one viewer file pair is deleted.

**Negative / tradeoffs**:

- The browser's PDF viewer features go away on `/preview`: no text selection, no built in zoom or find. Phone pinch zoom still works on the canvases. Download gives the real PDF for anything else.
- The worker bundle (about 1.2 MB, spec 0009) now loads on `/preview` too. It is already in the PWA precache, so a returning visitor pays nothing, but a first visit straight to `/preview` downloads it.
- The fit search takes longer in wall time than on the main thread, since each trial crosses to the worker and back. The strip says it is checking, and the full size pages are already shown, so nothing waits on it.
- Keeping two PDFs in memory costs a few hundred KB at most.
- In the rare unavailable case, the page shows no resume at all, only the notice and a working Download.

**Neutral**:

- No migration: one PR, reverted by reverting it.
- The PDF context file (`src/features/templates/pdf/AGENTS.md`) and root `AGENTS.md` need updating for the deleted viewer, the moved `PreviewPages` and the new preview rules; `/sync` owns that.

## Follow-up

- [ ] `/sync`: update the PDF context file (remove `LazyTemplateViewer` and `template-viewer.tsx`, note `/preview` on the worker, `PreviewPages` new home) and add a "Preview page (spec 0013)" rule to root `AGENTS.md`.
- [ ] `/scope`: tick the Deferred "One PDF viewer" item as decided here (canvas engine on `/preview`, gallery stays on `BlobProvider`).
- [ ] If phone users ask for zoom, consider zoom buttons on the canvases as a later feature.

## Rationale

Reasoning and options: see [rationale.md](rationale.md). Suggested browser checks: see [verify.md](verify.md).
