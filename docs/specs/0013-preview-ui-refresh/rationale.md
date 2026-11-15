# 0013. Preview UI refresh: rationale

## Context

`/preview` is the last app page still on the old look (scope feature 15). `src/features/preview/preview-page.tsx` (317 lines) mixes gradients, glass blur, a dot pattern and raw `slate`, `gray`, `indigo`, `green` and `orange` classes, all of which the design system refresh (spec 0004) and the gallery and builder refreshes (specs 0011, 0012) removed elsewhere. Its toolbar holds two buttons that both go to `/builder`, a hand made two button toggle, Download, and both toggles in one row, which does not fit a phone.

The resume is drawn by `PDFViewer` from `@react-pdf/renderer`, which is an `iframe` around a blob URL. Many phone browsers cannot draw a PDF inside an `iframe`, so on a phone the page often shows nothing at all. `PDFViewer` also gives no signal that its PDF is ready, so the page shows a blank frame while it renders. Spec 0011 hit the same problem on the gallery detail page and deferred the question of one shared viewer to this refresh.

The one page fit search renders the resume up to eight times with `renderResumePdf` on the main thread, so the page can stall while it runs, and Download renders the whole PDF a ninth time. Meanwhile spec 0009 built a preview worker that renders react-pdf off the main thread and a canvas drawer (`PreviewPages`) that the builder already uses.

The constraints for this pass hold: WCAG 2.2 AA, Lighthouse 95 or more, templates white and unchanged, the main bundle free of react-pdf (spec 0008), and `/preview` within its 188 KB first load budget.

## Options considered

### Option 1: Refresh the chrome and draw with the builder's worker

Rebuild the chrome on tokens and draw pages with the spec 0009 worker plus `PreviewPages`. Run the fit search through the worker and download the bytes already on screen.

**Pros**:

- Works on phones; no `iframe`.
- The main thread never renders a PDF on the happy path, so the page never stalls.
- Download is instant and identical to the screen.
- One drawing engine for builder and preview; two viewer files are deleted.

**Cons**:

- Loses the browser PDF viewer's text selection, find and zoom.
- First visit straight to `/preview` downloads the worker bundle.
- More new code than a restyle: an engine hook with careful request ordering.

### Option 2: Refresh the chrome and use the gallery's `BlobProvider` viewer

Reuse `gallery-pdf-viewer.tsx`, which shows a placeholder until the `iframe` reports it loaded.

**Pros**:

- Already built and tested; small change.
- Keeps the browser's PDF tools on desktop.

**Cons**:

- Still an `iframe`, so phones still show nothing.
- The fit search and Download still render on the main thread.

### Option 3: Restyle the chrome only

Keep `PDFViewer` and the current engine, change only the toolbar and states.

**Pros**:

- Smallest diff and lowest risk.

**Cons**:

- Leaves the phone bug, the blank frame and the main thread stalls in place.
- Leaves three PDF viewing paths in the app.

## Rationale

The scope says the preview chrome moves onto the design system, but the chrome is not the main problem: on a phone the page often shows no resume, and that is the one thing the page is for. Options 2 and 3 both keep an `iframe`, so they cannot fix it. Option 1 fixes it with code the project already ships and tests (the spec 0009 worker and `PreviewPages`), which is reuse, not new infrastructure.

Moving the fit search into the worker follows from the same choice. Once the worker is on the page, rendering trials on the main thread would load a second copy of react-pdf and keep the stalls. Downloading the kept bytes removes the ninth render and guarantees the file matches the screen. The cost is the lost browser PDF tools, which matter little on a page whose job is to check and download: the downloaded file still has them.

The one subtle risk is request ordering. `createPreviewClient` keeps one waiting slot and one result callback, built for the builder's "newest wins" typing case. The fit search needs each answer paired with its question, so the hook keeps exactly one request outstanding and tags each run with an id. This is written as an invariant and tested with a fake client, because getting it wrong would draw or download the wrong scale silently.

A `fit` message that runs the whole search inside the worker and returns `{ scale, pdf, pages }` was considered and rejected. It would save the trial transfers and the pairing rules, but counting pages in the worker means running pdf.js inside it (pdf.js normally spawns its own worker), which grows the 1.2 MB worker bundle and its precache risk. The main thread count is cheap, and the pairing rules are written down and tested.

The cross check on this spec (a second model) found the failure paths of the engine hook underspecified: late results after a timeout, a crash mid search, a late `ready`, stale bytes across a language change, StrictMode. Each now has a written rule in the Engine hook section and a test scenario.

Smaller calls made in this spec, each with its runner up:

- Full size stays the default and the choice is not stored: a one page fit depends on content that changes between visits (runner up: remember the mode).
- The template falls back to the saved resume's `templateId` before `developer`, matching what the builder last used (runner up: always `developer`).
- The export error stays a dialog, matching the builder's PDF error dialog (runner up: a toast).
- The page scrolls with sticky bars, like the builder, instead of an `h-screen` frame, which behaves badly with phone address bars and pinch zoom.
- `PreviewPages` moves to `src/features/pdf/live-preview/`, next to the engine it draws, with its shared strings under `pdfPreview.*`; the builder only page count line stays in the builder (runner up: import it from the builder folder, which couples the preview feature to the builder).
- Mode labels change from "Multi" and "Single" to "Full size" and "One page", which say what each does.
