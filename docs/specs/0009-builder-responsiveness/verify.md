# Verify: Builder responsiveness · spec 0009 · updated 2026-11-05

_Steps derived from spec 0009 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

_Run 2026-11-05 against `vite preview` of a fresh build, offline only: in Chromium through Playwright (context offline switch) and in Safari 27.0.1 through `safaridriver` (server stopped, since Safari has no scriptable offline switch), with the long fixture at 1440 by 900. Both passed: the service worker cache held `preview-worker-*.js` after one online visit, the offline reload drew all 4 pages in about a second, and typing into first name redrew them in about 1.5 seconds with no notice. The other steps are still to run._

Setup for the browser steps: `pnpm build && pnpm preview`, then put `src/test/fixtures/long-resume.json` into `localStorage.resumeData` and open `/builder?templateId=developer`.

## UI / manual

- [ ] At 1440px wide, open `/builder` → an `aside` labelled "Live preview" sits beside the form and shows "Preparing preview…", then pages → AC-6, AC-9, AC-15
- [ ] Clear storage (empty form), open `/builder` at 1440px → the template's empty page is drawn before you type anything → AC-9
- [ ] Type into first name, stop → the pages redraw about 700ms after the last key, never per key; the old pages stay until the new ones are in (no blank flash) → AC-6, AC-8
- [ ] Type a bad email (`abc`) → the preview still updates and shows `abc` as typed → AC-6
- [ ] Click into a field and out again without typing → no "Updating…" hint, no redraw → AC-6
- [ ] Switch the language EN ↔ PL → the preview redraws in the new language after about 700ms; the badge reads "4 pages" / "4 strony" → AC-6, AC-15
- [ ] Change the template through `?templateId=default` → the preview redraws in that template → AC-6
- [ ] Long fixture → badge "N pages" and the hint "Full size, Preview can fit it to one page"; a one page resume shows "1 page" and no hint → AC-8
- [ ] Scroll the panel to page 3, type → after the redraw the panel is still at page 3 → AC-8
- [ ] Resize the window from 1600px to 1300px → pages redraw at the new width; canvases are never wider than 900 CSS px; pixel ratio is at most 2 (check `canvas.width / parseFloat(canvas.style.width)` on a retina screen) → AC-8
- [ ] Each canvas has `role="img"` and a label like "Resume preview, page 2 of 4" → AC-15
- [ ] Press "Hide preview" in the toolbar → panel goes, form returns to the centered single column, `localStorage.builderPreviewOpen` is `'0'`, `aria-pressed` is false; reload → still hidden; type → no worker render runs (DevTools Network / worker shows no activity) → AC-10
- [ ] Below 1280px (for example 390px) → no panel, a floating "Preview" button; no worker exists until you press it (DevTools, Sources, Threads) → AC-11
- [ ] Press "Preview" → full screen sheet renders at once (no 700ms wait), same badge and notices; Tab stays inside the sheet; Escape closes it and focus is back on the floating button; the "Close preview" button also closes it → AC-11, AC-15
- [ ] With `prefers-reduced-motion: reduce` emulated, open the sheet → no slide or fade → AC-15
- [ ] Dark mode → the resume pages stay white → AC-15
- [ ] DevTools, block `assets/preview-worker-*.js`, reload at 1440px → after up to 20 seconds the panel shows "Live preview is unavailable here" and an "Open preview" button, disabled until the form passes 30% and is valid; when enabled it saves and opens `/preview` → AC-13
- [ ] Make a render fail (for example DevTools, block `fonts/` requests after the first render, then type) → the last pages stay and "Preview could not update" shows; unblock and type again → the notice goes → AC-12
- [x] Offline: after one online visit to `/builder` that started the preview, DevTools offline, reload, type → the panel still draws and updates. Run in Chrome (done once in Chromium through Playwright) and in Safari (done once in Safari 27.0.1 through `safaridriver`, server stopped) → AC-14
- [ ] Type into experience 3, then close the tab within 30 seconds; reopen `/builder` → the edit is there. Repeat by switching tabs (hidden), and by leaving through "Back to templates" → AC-3
- [ ] DevTools Performance, 4x CPU slowdown, panel open, type 20 characters into experience 3's description → no main thread task over 50ms from a keystroke or a preview update (see rationale.md Baseline) → AC-5

## Commands

- [ ] `pnpm vitest run src/features/builder/builder-render-counts.test.tsx` → typing in experience, education and language card 3 renders no other card or section card → AC-1
- [ ] `pnpm vitest run src/features/builder/builder-page.test.tsx` → the spec 0005 suite plus the same length import case pass → AC-2
- [ ] `pnpm vitest run src/features/builder/use-resume-autosave.test.ts` → pagehide, hidden, visible, typing only and unmount cases pass → AC-3
- [ ] `pnpm vitest run src/features/pdf/live-preview src/features/builder/live-preview` → client, hook, pages and layout tests pass → AC-6, AC-8, AC-10, AC-11, AC-12, AC-13, AC-15
- [ ] `pnpm vitest run --project pdf src/features/pdf/live-preview` → long and empty resumes render for all three templates → AC-6, AC-9
- [ ] `pnpm build && pnpm perf:size` → `/builder` within 262 KB, `lazyEngines` unchanged and passing → AC-7
- [ ] `grep -rnE "renderResumePdf|template-pdf|template-viewer|@react-pdf" src/features/builder --include='*.ts' --include='*.tsx' | grep -v test` → no output → AC-7
- [x] `ls -l dist/assets/preview-worker-*.js` and `grep preview-worker dist/sw.js` → each worker file under 3 MB and listed in the precache → AC-14
- [ ] Zod time per parse of the long fixture at 4x stays under 2ms (rationale.md Baseline, 0.07ms) → AC-4

## Value sourcing checks

- [ ] Render data comes from the form store as typed: type an invalid email, the PDF shows it → resume data
- [ ] Wait trigger is the values reference: blur only does not render, a real edit does → whether to wait
- [ ] Render timeout `RENDER_TIMEOUT_MS` 30s: covered by the client test "should report failed and send the pending request when a render times out" → render timeout
- [ ] Template is `values.templateId`: change `?templateId=` and the preview follows → template
- [ ] Language is `normalizeLang(i18n.language)`: switch to PL, the PDF headers turn Polish → language
- [ ] Compact scale is 0: a long resume shows its full page count, never the one page fit → compact scale
- [ ] `seq` drops stale answers: covered by the client test "should drop a late result" → seq
- [ ] Debounce 700ms and ready timeout 20s: covered by the hook and client tests → debounce, ready timeout
- [ ] Page count comes from the drawn canvases: badge number equals the canvas count → page badge
- [ ] Canvas size from the container width capped at 900 and `min(devicePixelRatio, 2)`: check on a retina screen and on a very wide window → canvas size
- [ ] Resize redraws from the kept document, never the bytes: covered by the pages test (one `loadPdf` call, two draws) → redraw on resize
- [ ] Wide or narrow from `(min-width: 1280px)`: drag the window across 1280px and the panel and floating button swap → layout
- [ ] Panel open from `builderPreviewOpen`, missing means open: delete the key, reload, the panel shows → panel open
- [ ] Open preview gate is the Preview CV rule: empty form disabled, valid form at 30% enabled → gate
- [ ] Autosave on hide compares against the last saved JSON: hide twice with no edit, `resumeData_lastSaved` changes only once → autosave on hide

## Acceptance criteria coverage

- AC-1 render count test · AC-2 builder page suite plus the same length import case · AC-3 autosave tests plus the manual close tab step · AC-4 Baseline Zod time · AC-5 Baseline profiles plus the manual DevTools step · AC-6 hook, client, pdf project tests plus the browser steps · AC-7 `perf:size` plus the import grep · AC-8 pages tests plus the scroll and resize steps · AC-9 empty form step plus the pdf project test · AC-10 layout test plus the toggle step · AC-11 layout test plus the narrow steps · AC-12 client and pages tests plus the blocked fonts step · AC-13 client tests, layout test, blocked worker step · AC-14 offline step (Chromium and Safari done) plus the precache check · AC-15 tests for labels, roles, focus, plus the motion and dark mode steps
