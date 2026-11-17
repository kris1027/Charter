# 0014. Accessibility and Lighthouse pass: rationale

## Context

The scope's last Slice 3 feature asks for a sweep against WCAG 2.2 AA and Lighthouse 95+ in every category, done when every page scores 95+ in all four categories and an automated axe check finds no serious issues, in EN and PL, light and dark. Features 12 to 15 refreshed every page, so this pass checks what the refresh missed and keeps it from coming back.

Today's checks come from spec 0003. Lighthouse CI audits five pages once each in the English light theme (plus `/preview` in dark, added by spec 0013), on mobile settings only, three runs per URL. Its floors were set from the first CI run on 2026-11-02, before the gallery and builder refresh, so several are far below 95: `/templates/developer` performance 0.68 and accessibility 0.93, `/builder` accessibility 0.90, several SEO floors at 0.90. Nothing audits Polish, the dark theme on four of five pages, a first time visitor (privacy notice, empty builder, empty preview), or anything inside a menu, dialog, sheet or popover.

Lighthouse's accessibility score runs a subset of axe and weighs each audit, so one serious failure can still leave the score at 0.93 or more. It cannot express "no serious issues". Some WCAG 2.2 criteria cannot be automated at all: focus not obscured (2.4.11) is a real risk with the sticky builder toolbar, section strip and preview page strip; target size (2.5.8), dragging alternatives (2.5.7) for the sortable lists, keyboard only use and reflow need a person.

The detail page renders the template PDF only from `lg` up (spec 0011). Lighthouse's mobile emulation never reaches that path, so its cost on desktop has never been measured in CI.

## Options considered

### Option 1: `@axe-core/puppeteer` script as its own blocking CI job, plus a wider LHCI matrix

A Node script reuses the puppeteer already installed for the Lighthouse seed, seeds each visitor the same way, scans pages and opened overlays with axe, and fails on serious and critical impact. LHCI keeps its job and grows its URL list.

**Pros**:

- One new dev dependency; same browser automation and seed as Lighthouse.
- Fails by impact, which is exactly what the Done when asks.
- Real Chrome with layout, so color contrast and target size rules work.

**Cons**:

- A hand written runner (matrix, concurrency, report) to maintain, about the size of the perf scripts.
- Open state scans couple to accessible names in the UI.

### Option 2: Playwright with `@axe-core/playwright`

Playwright test runner with fixtures, traces and parallel workers, axe through its official integration.

**Pros**:

- Better runner: retries, traces and HTML report for free.
- Clear test per page and state.

**Cons**:

- A second browser automation stack next to puppeteer, plus its own browser downloads in CI.
- The Lighthouse seed would exist twice, once per stack.

### Option 3: `vitest-axe` in jsdom

Axe on rendered components inside `pnpm test`.

**Pros**:

- Fast, runs with the existing tests, no server.

**Cons**:

- jsdom has no layout or computed colors, so contrast, target size and many real issues are invisible.
- Tests components, not built pages in a real theme and language.

### Option 4: Lighthouse only

Rely on the Lighthouse accessibility category with higher floors.

**Pros**:

- No new tool.

**Cons**:

- Scores by weight; cannot fail on "any serious issue".
- Never sees overlays or first visit states, and runs each page in a single layout.

## Rationale

Option 1 is the smallest change that meets the Done when as written. The project already runs puppeteer and a seed script in CI, so axe on top of it adds one dependency and reuses the visitor setup Lighthouse uses, which keeps both checks looking at the same app state. Playwright is the better test runner, but bringing a second automation stack in to scan about a hundred states is weight the project does not need, and the duplicated seed would drift. jsdom cannot judge contrast, the most common real failure on a newly themed UI, and Lighthouse alone cannot fail by impact.

A blocking job, rather than warnings, follows spec 0003: the reason those checks exist is that a soft check is ignored. Running it as its own job in parallel keeps CI time near the Lighthouse job's, instead of adding to it.

For the Lighthouse matrix, only performance is noisy; accessibility, best practices and SEO give the same score every run on the same build. Theme and language barely change load cost. So the three extra variants run once and assert only the deterministic categories, which meets "95+ in EN and PL, light and dark" for those categories at half the cost of three runs everywhere. Performance stays gated on EN light, where three runs make the median meaningful.

The 0.68 floor on `/templates/developer` turned out to be stale, not a trade off: after spec 0011 the page scores 1.00 on mobile in CI, because the PDF never mounts there. The real unknown was desktop, where it does mount. Measured locally it scores 0.96 to 0.99, so desktop runs for that page and `/builder` (whose side preview also needs a wide screen) can be gated at 0.95 or more without touching the PDF mount. No performance trade off is owed.

Floors keep spec 0003's rule (median minus a small margin) so a drop from 1.00 to 0.96 still fails, but are clamped to 0.95 so no page can sit below the target the scope sets.

## Baseline

### Before this feature

Last CI run on `main` before this spec, run 43765795996 at `d014d3d` (2026-11-15), mobile, EN, medians:

| Page                   | Performance (floor) | Accessibility (floor) | Best practices (floor) | SEO (floor) |
| ---------------------- | ------------------- | --------------------- | ---------------------- | ----------- |
| `/`                    | 0.99 (0.98)         | 1.00 (0.98)           | 1.00 (0.98)            | 1.00 (0.98) |
| `/templates`           | 1.00 (0.96)         | 1.00 (0.98)           | 1.00 (0.98)            | 1.00 (0.90) |
| `/templates/developer` | 1.00 (0.68)         | 1.00 (0.93)           | 1.00 (0.98)            | 1.00 (0.90) |
| `/builder`             | 1.00 (0.97)         | 1.00 (0.90)           | 0.96 (0.94)            | 1.00 (0.90) |
| `/preview`             | 1.00 (0.90)         | 1.00 (0.98)           | 1.00 (0.98)            | 1.00 (0.98) |
| `/preview?theme=dark`  | 1.00 (0.90)         | 1.00 (0.98)           | 1.00 (0.98)            | 1.00 (0.98) |

`/builder` best practices loses 0.04 to the `inspector-issues` audit: Chrome's Issues panel logs a "Content security policy" issue (no sub items in the report). AC-12 traces it.

Local desktop preset, unseeded, `vite preview`, 2026-11-17, single runs: `/templates/developer` 0.96, 0.99, 0.99 performance, 1.00 in the other three; `/builder` 0.98, 0.98 performance, best practices 0.96; `/preview` 0.99, 0.99.

### After this feature

**Cause of the `/builder` CSP issue (AC-12).** Not the `<meta>` CSP. Zod 4 probes once whether it may compile faster parsers with `new Function('')`; `script-src` has no `'unsafe-eval'`, so Chrome blocks the probe and logs a `ContentSecurityPolicyIssue` (`kEvalViolation`, `script-src`) from the `builder` chunk, the first chunk that parses a schema. Lighthouse's `inspector-issues` audit counts it, so best practices fell to 0.96 on every `/builder` variant and the desktop run. Fix: `z.config({ jitless: true })` in `src/features/resume/resume-schema.ts`, so Zod never probes. The CSP itself is unchanged.

**Local check before CI**, `pnpm perf:lhci` on macOS, 2026-11-17, before the Zod fix: all 22 URLs ran and passed their provisional 0.95 floors. Every median was 1.00 except `/builder` best practices 0.96 (all five `/builder` URLs, the CSP issue above) and phone performance on single run variants at 0.98 to 0.99. The same run after the fix: every `/builder` URL scores 1.00 in best practices, on phone and desktop; all 22 URLs pass.

_Still to fill from CI (AC-10): the first green CI run id of this PR after the fix pass, the median per URL and category for all 22 URLs, and the floors locked from them._

## Manual review

Run on the final build (`vite preview`, Chrome) on 2026-11-17. A keyboard walk script covered `/`, `/templates`, `/templates/developer`, `/builder` and `/preview` at 412 px and 1350 px; the rest was checked in the browser. Items marked **owed** need a person with a screen reader and are not done yet.

| Criterion                                     | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1.1 Keyboard, 2.1.2 No keyboard trap        | Pass. Tab reaches every control on each page (87 on `/builder` at 412 px, 88 at 1350 px) and never sticks; menus, dialogs, the sheet, the date picker and selects open with Enter or Space and close with Escape (axe open state scans drive them the same way).                                                                                                                                                                                                                                    |
| 2.4.3 Focus order, 3.2.1 On focus             | Pass. Focus follows reading order; overlays return focus to their trigger (Radix, plus the builder's own `onCloseAutoFocus` handlers).                                                                                                                                                                                                                                                                                                                                                              |
| 2.4.7 Focus visible, 1.4.11 Non text contrast | Pass. The global `:focus-visible` outline (2 px, `--ring`) shows on every control in light and dark.                                                                                                                                                                                                                                                                                                                                                                                                |
| 2.4.11 Focus not obscured (minimum)           | Pass with an exception. The sticky toolbar and section strip never hide a focused control (`scroll-padding` from spec 0012). Exception: the "App ready to work offline" toast, shown once after the service worker installs, can cover a field near the bottom of a phone screen for its 5 s; it is a transient status message, closes by itself and can be swiped away. **Fixed** alongside: on phones that toast covered the floating Preview button, so toasts now sit 5rem up (`mobileOffset`). |
| 2.5.7 Dragging movements                      | Pass. Card lists have Move up and Move down buttons; chips have an actions menu with Move left and Move right; drag handles also work with the keyboard.                                                                                                                                                                                                                                                                                                                                            |
| 2.5.8 Target size (minimum)                   | Pass. axe `target-size` passes in every scan; the 16 px checkboxes have their label as part of the target and enough spacing.                                                                                                                                                                                                                                                                                                                                                                       |
| 1.4.10 Reflow, 1.4.4 Resize text              | Pass at 320 px in EN and PL: no page scrolls sideways; the builder section strip scrolls inside itself by design. 200% zoom: **owed**, to be checked by hand.                                                                                                                                                                                                                                                                                                                                       |
| 1.4.12 Text spacing                           | **Owed**, needs the bookmarklet by hand.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.3.1, 3.3.1, 3.3.2, 3.3.3 Forms              | Pass for labels and wiring: every field has a visible label tied by `for`/`id`, errors show after blur and are tied with `aria-describedby` and `aria-invalid` (spec 0012). Screen reader announcement in EN and PL: **owed**.                                                                                                                                                                                                                                                                      |
| 4.1.3 Status messages                         | Toasts sit in Sonner's labelled live region; the builder save status and `/preview` page count use status regions. Announcement by a screen reader: **owed**.                                                                                                                                                                                                                                                                                                                                       |
| 2.2.2 Pause, stop, hide; reduced motion       | Pass. With reduced motion every axe scan renders all content visible (spec 0008 `data-entrance` fallback), and the landing page's parallax is off.                                                                                                                                                                                                                                                                                                                                                  |
| 3.1.1, 3.1.2 Language                         | Pass. `<html lang>` follows the language on every page (the axe scan checks it in all 108 scans); the language menu names each language in its own language.                                                                                                                                                                                                                                                                                                                                        |
| 1.1.1 Non text content                        | Pass. Gallery and template images have names saying which template they show, preview canvases are named per page, and decorative icons carry `aria-hidden`.                                                                                                                                                                                                                                                                                                                                        |
| 2.4.2 Page titled, 2.4.6 Headings             | **Fixed.** Titles were English only; each route now takes its title from `pageTitle.*` in EN and PL, and the root layout reruns `head` on a language change. One `h1` per page, headings in order.                                                                                                                                                                                                                                                                                                  |
| 3.2.6, 3.3.7, 3.3.8                           | Not applicable: no help mechanism repeated across pages, no multi step entry, no sign in.                                                                                                                                                                                                                                                                                                                                                                                                           |

Fixes from the automated scans, for the record: date picker year buttons, year select and popover had no names (now labelled, keys `accessibility.chooseDate`, `previousYear`, `nextYear`, `year`); the theme and language menus were modal and hid the page with focusable content inside `aria-hidden` (now `modal={false}`, like the builder's actions menu); the live preview panel scrolled with nothing focusable inside (now `tabIndex={0}`). The Radix Select stays modal by design, so its open state scans only the list (exception in `scripts/a11y/axe-exceptions.ts`).
