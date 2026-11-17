# 0014. Accessibility and Lighthouse pass: an axe gate in CI, the full EN/PL and light/dark matrix, and floors of at least 0.95

**Date**: 2026-11-17
**Status**: In Progress

## Summary

This spec adds an automated accessibility check (axe, the engine Lighthouse itself uses for its accessibility audits) that scans every page in English and Polish, light and dark, on a phone and a desktop, both as a returning and as a first time visitor. It runs as its own blocking CI job and fails on any serious or critical issue. Lighthouse CI grows from 6 to 22 audited URLs, adds desktop runs for the two pages that only mount a PDF from `lg` up, and every floor is lifted to at least 0.95. A short manual WCAG 2.2 AA review covers what tools cannot check (focus hidden under sticky bars, target size, keyboard only use), and everything found is fixed in this pass.

## Requirements

**User stories**:

- As a keyboard or screen reader user, I want every page and every menu or dialog to meet WCAG 2.2 AA so that I can build and export a resume without a mouse or sight.
- As a Polish speaker or a dark theme user, I want the same accessibility the English light theme gets, so that my variant is not a second class one.
- As the maintainer, I want CI to fail on a serious accessibility issue and on any Lighthouse score below 95 so that this pass cannot quietly regress.

**Acceptance criteria**:

- **AC-1**: `pnpm a11y:scan` serves the existing `dist` with `vite preview` on port 4173 (started and stopped by the script), runs every scan in AC-3 and AC-5, and exits 0 when no scan has a violation of impact `serious` or `critical`. It exits non zero otherwise, after all scans have run. `pnpm a11y` runs `pnpm build` with `VITE_SITE_URL=http://localhost:4173` (the same value CI builds with), then `pnpm a11y:scan`. Neither is part of `pnpm pre-commit`.
- **AC-2**: Each scan runs `@axe-core/puppeteer` with the rule tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` and `best-practice`. Violations of impact `moderate` or `minor` are reported (console, table, JSON) but never fail; they are fixed in this pass where cheap and otherwise left visible in the report, with no separate tracking. Axe's `incomplete` results (checks it cannot decide, such as contrast over gradients or images) are counted in the report and never fail; the manual review owns them. `axe-core` is pinned to an exact version in `package.json` (no `^`), bumped only in its own PR. Axe always runs every rule those tags select, with nothing excluded. Exceptions live in `scripts/a11y/axe-exceptions.ts`, each with the paths it applies to (every variant of those paths) and a non empty `reason`. A rule exception holds a rule id and a target selector and is applied after the run by dropping matching violations (rule id and target) from the failing set. A narrowing exception (AC-5) names an open state and the overlay selector that state fails on; the whole page is still scanned. Dropped violations, and whole page violations outside a narrowing, still show in the report as excepted. The script fails before scanning on an entry with an empty reason, and the summary lists every exception in force.
- **AC-3**: The load scans cover the pages `/`, `/templates`, `/templates/developer`, `/builder`, `/preview`, each in every combination of language (`en`, `pl`), theme (`light`, `dark`), viewport (phone 412 × 823, desktop 1350 × 940) and visitor (returning, first visit): 80 scans.
- **AC-4**: Before every scan, the page is set up as follows. A returning visitor holds what the Lighthouse seed writes today (spec 0003 AC-7): the fixture resume under `resumeData`, `privacyNoticeAccepted`, `pwaInstallDismissed`, plus `language` and `theme` for the variant. A first visitor holds only `language` and `theme`, so the privacy notice and the empty builder and preview states show. Every scan runs in its own fresh browser context (`browser.createBrowserContext()`), so storage, service workers and Cache Storage never carry over between scans running at the same time; the axe script does not call `clearWorkers`. Storage is written on the origin before the page is opened, with the same values and formats the app writes (`language` as a bare `en` or `pl`, `theme` as `light` or `dark`). `prefers-reduced-motion: reduce` is emulated, so results hold for the reduced motion render (a known limit; mid animation states are left to the manual review). The scan starts after the `load` event, `page.waitForNetworkIdle({ idleTime: 500 })`, `document.fonts.ready`, and a ready selector per route: the `h1` on every page; on `/builder` also the first form section; on `/preview` for a returning visitor the export button (`data-testid='export-pdf'`); on `/templates/developer` at desktop the PDF viewer mounted or the prebuilt image still shown. Each wait is capped at 15 s and a failed wait is retried once; a second timeout fails that scan with a message naming page and variant, never a silent skip. Axe violations are never retried. After load, the script checks `<html lang>` equals the variant's language and fails the scan if not, so a seed that did not take is caught.
- **AC-5**: The open state scans open each overlay through its real trigger (found by role and accessible name) as a returning visitor, in all four language and theme combinations, at the one viewport named below (the matrix holds the viewport as data), then scan the whole page with the overlay open (28 scans). The overlay counts as open when an element with its role is visible: `menu` for menus, `dialog` or `alertdialog` for the dialog and sheet, `dialog` for the date picker popover, `listbox` for the select. Radix hides the rest of the page from assistive technology while an overlay is open; that is expected, and the whole page is still scanned. If whole page scans keep producing violations caused by Radix itself (not by the app), the scan narrows to the overlay with `include`, recorded as an exception with its reason:
    1. `/`, desktop: the theme menu
    2. `/`, desktop: the language menu
    3. `/builder`, desktop: the toolbar actions menu
    4. `/builder`, desktop: the reset dialog, opened from the actions menu
    5. `/builder`, phone: the live preview sheet
    6. `/builder`, desktop: the date picker popover of the first experience entry's start date
    7. `/builder`, desktop: the level select of the first language card

    The fixture resume (`src/test/fixtures/perf-resume.json`) holds at least one experience entry and one language, so states 6 and 7 have a target. The scan scrolls each trigger to the top of the viewport, below the sticky bars, before clicking it. If a trigger is not found or its overlay does not open within 15 s, the page is loaded again and the overlay opened once more; a second failure fails that scan and names the state.

    Where Radix's modal behaviour on a menu hid the page with focusable content inside `aria-hidden`, the fix pass made the menu non modal (`modal={false}`, as the builder's actions menu already was) instead of narrowing its scan: a non modal menu also leaves the page usable for assistive technology. The Radix Select cannot be made non modal, so its state narrows to `[role="listbox"]`.

- **AC-6**: For every violation, the console prints the rule id, impact, page, variant (language, theme, viewport, visitor), state (or `load`), target selector and axe's help URL. The script writes a markdown table (one row per page and state, columns for each variant group, counts by impact, plus excepted and incomplete counts) to `GITHUB_STEP_SUMMARY` when that variable is set, on pass and on failure, and writes the full axe results to `.a11y/axe-results.json`. `.a11y/` is git ignored and ignored by Prettier and ESLint.
- **AC-7**: CI gets a new `accessibility` job that needs `lint-format-test-build`, downloads the `dist` artifact, runs `pnpm a11y:scan` against `CHROME_PATH=/usr/bin/google-chrome`, and uploads `.a11y` as a workflow artifact kept 14 days (also on failure). It runs in parallel with the `lighthouse` job, two scans at a time (a `CONCURRENCY` constant, 2 in CI, 4 locally). The job carries `continue-on-error: true` until the fix pass (build step 6) is done; the last commit of this feature removes it, so from then on its failure fails the workflow. The script launches `CHROME_PATH` when set, else puppeteer's own browser (`npx puppeteer browsers install chrome` once locally if missing), and `@axe-core/puppeteer` is checked to support the installed puppeteer major before it is added.
- **AC-8**: Lighthouse CI on mobile settings audits every page from AC-3 in four variants: EN light (no query), EN dark (`?theme=dark`), PL light (`?lang=pl`), PL dark (`?theme=dark&lang=pl`). Both LHCI configs keep `numberOfRuns: 1` and repeat a URL in `collect.url` to get more runs (the seed script runs once per URL entry, spec 0003): EN light URLs appear 3 times and assert all four categories; the other three variants appear once and assert accessibility, best practices and SEO, their performance reported, not asserted. The seed script parses the audited URL's query with `URLSearchParams`, stores `theme` (`dark`, else `light`) and `language` (`pl`, else `en`), and ignores `viewport`; the `/preview` export button rule of spec 0003 AC-7 applies to every `/preview` variant, by pathname.
- **AC-9**: Lighthouse CI also audits `/templates/developer?viewport=desktop` and `/builder?viewport=desktop` in EN light with the Lighthouse desktop preset, 3 runs each, asserting accessibility, best practices and SEO; desktop performance is reported, and gets a floor as AC-10 describes. `pnpm perf:lhci` replaces `lhci autorun` with four steps: `lhci collect` (mobile, `lighthouserc.cjs`, which starts `vite preview`), `lhci collect --additive --config=./lighthouserc.desktop.cjs` (`ci.collect.settings.preset: 'desktop'`, no `startServerCommand`; the build first confirms whether the first collect's server is still up and, if not, starts `vite preview` once outside LHCI for both collects), `lhci assert` and `lhci upload` (both reading `lighthouserc.cjs`). Results land in one `.lighthouseci` set, so one assert and one `pnpm perf:lhci-summary` table cover all 22 URLs, one row per URL with its query and a Device column (`phone` or `desktop`). The build confirms `lhci assert` treats an `assertMatrix` entry that matches no run as a failure (or adds a check that every floors key matched a run).
- **AC-10**: Every asserted floor is at least 0.95 and at most 1.00. Floors live in one `floors` map in `lighthouserc.cjs` (each URL holds only the categories it asserts, so the type becomes `Partial`), which `lighthouserc.desktop.cjs` and the summary both import. Each floor is the median of that URL and category from the first green CI run after the fix pass (build step 6), minus 0.02, or minus 0.05 for every performance floor, then clamped to [0.95, 1.00]. Until that run the floors are 0.95. Desktop performance is reported, not asserted, until three CI runs of it exist; then it gets a floor by the same rule. Where no floor of at least 0.95 would hold for a URL, its performance stays reported, with the reason in rationale (`/templates/developer` on desktop). The medians, the run id and the floors are recorded in [rationale.md](rationale.md#baseline), and `lighthouserc.cjs` points to this spec.
- **AC-11**: On this feature's final PR, `pnpm a11y:scan` exits 0 (no serious or critical violation in any of the 108 scans) and every Lighthouse median in AC-8 and AC-9 is at least 0.95.
- **AC-12**: The Chrome Issues panel entry ("Content security policy") that holds `/builder` best practices at 0.96 is traced to its cause. The build starts from the likely cause: the `<meta>` CSP that `vite.config.ts` injects, where some directives (such as `frame-ancestors` or `report-uri`) are ignored in a meta tag and Chrome logs an issue. It is fixed, keeping the CSP in `vercel.json` and `vite.config.ts` in sync, or, when its source is outside the app (the `vite preview` server or the browser), the cause is recorded in [rationale.md](rationale.md#baseline) and the floor stays at 0.95.
- **AC-13**: The manual WCAG 2.2 AA checklist in [verify.md](verify.md) is run once on the final build. Each item's result (pass, fixed, or exception with a reason) is recorded in [rationale.md](rationale.md#manual-review). No item is left failing without a recorded reason.
- **AC-14**: Fixes follow the project rules: new user facing strings go through `t()` with keys in both `en` and `pl`; files in `TOKEN_ONLY_FILES` use app tokens only; templates are unchanged (`pnpm templates:previews --check` passes with no regenerated image); `perf/budgets.json` is not raised; `pnpm pre-commit` passes.
- **AC-15**: Accessibility of the exported PDF file (tagged PDF, reading order) is out of scope and is listed in the scope's Deferred list.

## Decision

**Chosen option**: Option 1: an `@axe-core/puppeteer` scan as its own CI job (blocking once the fix pass lands), plus a wider Lighthouse CI matrix on the existing setup.

Axe runs from a new script that reuses spec 0003's seed logic and puppeteer, fails on serious and critical violations across 108 scans, and blocks CI once the fix pass is in. Lighthouse CI keeps its job and floors mechanism, gains the PL and dark variants (one run each, deterministic categories only) and desktop runs for the two PDF pages, and every floor moves to at least 0.95.

Choices made in the design (runner up in brackets):

- **Variant encoding**: the variant travels in the audited URL's query (`theme`, `lang`, `viewport`), which the app keeps in the URL but never reads (i18n detection is `localStorage` then `navigator`, no query; the theme reads storage) and the seed reads, exactly like today's `?theme=dark`. LHCI groups and asserts by URL, so each variant gets its own row and floors. (Runner up: one LHCI config per variant; four configs to keep in step.)
- **Desktop collect**: a second `lhci collect` with `--additive` and the desktop preset, from `lighthouserc.desktop.cjs` that reuses `ORIGIN`, the seed and the server settings from `lighthouserc.cjs`; then one `lhci assert` and one upload. `pnpm perf:lhci` runs the four steps in order. (Runner up: a separate desktop LHCI job; a second summary and a second floors file.)
- **Shared seed**: the visitor setup moves to `scripts/perf/seed-visitor.cjs` (`seedVisitor(page, { visitor, theme, lang })` plus `clearWorkers`), used by `lhci-seed.cjs` and the axe script, so both checks see the same visitor. (Runner up: copy the seed into the axe script; two seeds drift.)
- **Reduced motion during scans**: emulated, so entrance animations (spec 0008 `data-entrance`) cannot be scanned mid fade and report false contrast failures. Motion itself is checked by the manual review. (Runner up: wait for animations to finish; timing based and flaky.)
- **Axe script language**: TypeScript run by Node, like `scripts/perf/*.ts`, at `scripts/a11y/axe-scan.ts`, loading the CJS seed through `createRequire`. Scans run in one browser, a fresh context each, `CONCURRENCY` at a time.
- **The template sheet is not an overlay**: `TemplateSheet` in `src/features/gallery/` is the always white paper image, not a Radix sheet, so the gallery has no open state to scan; its load scans cover it.

**Implementation skills**: `vite` (`antfu/skills`, `.agents/skills/vite/`) for the `vite preview` server the scan starts · `vitest` (`antfu/skills`, `.agents/skills/vitest/`) for unit tests of the matrix and summary helpers

## Rationale

Reasoning, options and the measured baseline: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**: none persisted. The scan matrix is plain constants in `scripts/a11y/axe-matrix.ts`:

| Type            | Fields                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Variant`       | `lang: 'en' \| 'pl'`, `theme: 'light' \| 'dark'`, `viewport: 'phone' \| 'desktop'`, `visitor: 'returning' \| 'first'`         |
| `LoadScan`      | `path`, `variant`                                                                                                             |
| `OpenStateScan` | `path`, `name`, `viewport`, `open(page)` (finds the trigger by role and name, clicks, waits up to 15 s for the overlay)       |
| `AxeException`  | `kind` (`rule` or `narrow`), `rule` or `state`, `selector`, `paths`, `reason` (non empty)                                     |
| `ScanResult`    | `scan`, `violations` (axe result, with `impact`), `error` (a failed wait or missing trigger), counted by impact for the table |

**Surfaces**:

| Surface                         | Kind          | Inputs                                  | Output                                                         | Fails when                                                        |
| ------------------------------- | ------------- | --------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| `pnpm a11y:scan`                | script        | built `dist`, `CHROME_PATH` (optional)  | console list, job summary table, `.a11y/axe-results.json`      | any serious or critical violation, a failed wait, empty exception |
| `pnpm a11y`                     | script        | source                                  | `pnpm build`, then the above                                   | as above, or the build fails                                      |
| `pnpm perf:lhci`                | script        | built `dist`, `CHROME_PATH`             | collect, collect --additive (desktop), assert, upload: 22 URLs | a median below its floor                                          |
| `pnpm perf:lhci-summary`        | script        | `.lighthouseci` manifest, shared floors | one row per URL with query and Device, warnings below 0.95     | never (exit 0, as today)                                          |
| CI job `accessibility`          | GitHub Action | `dist` artifact                         | job summary, `.a11y` artifact (14 days)                        | `pnpm a11y:scan` exits non zero                                   |
| `scripts/perf/seed-visitor.cjs` | module        | `page`, `{ visitor, theme, lang }`      | storage seeded, no worker or cache left                        | `/preview` export button missing after 10 s (returning visitor)   |

**Value sourcing**:

| Action             | Value                                | Source                                                                                                                                                           |
| ------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seed (Lighthouse)  | theme stored                         | audited URL query `theme` (`dark`), else `light`                                                                                                                 |
| Seed (Lighthouse)  | language stored                      | audited URL query `lang` (`pl`), else `en`                                                                                                                       |
| Seed (both)        | saved resume                         | `src/test/fixtures/perf-resume.json` (spec 0003)                                                                                                                 |
| Seed (axe)         | theme, language, visitor             | the scan's `Variant` from `axe-matrix.ts`                                                                                                                        |
| Lighthouse collect | phone or desktop settings            | which config runs it: `lighthouserc.cjs` (mobile) or `lighthouserc.desktop.cjs` (`settings.preset: 'desktop'`); the `?viewport=desktop` query only names the URL |
| Lighthouse summary | Device column                        | `phone` unless the URL's query holds `viewport=desktop`                                                                                                          |
| Lighthouse assert  | runs and asserted categories per URL | how often the URL repeats in `collect.url` and which categories its `floors` entry holds (AC-8, AC-9, AC-10)                                                     |
| Lighthouse assert  | floor per URL and category           | first green CI run after the fix pass, median minus margin, clamped (AC-10), stored in the shared `floors` map                                                   |
| Axe scan           | stored language and theme format     | what the app writes: `language` bare code (`src/i18n/config.ts`, `lookupLocalStorage`), `theme` `light` or `dark`                                                |
| Axe scan           | viewport size                        | phone 412 × 823 (Lighthouse's mobile size), desktop 1350 × 940 (Lighthouse's desktop preset)                                                                     |
| Axe scan           | fail or report                       | violation `impact` from axe (AC-2)                                                                                                                               |
| Axe report         | help URL per violation               | axe result `helpUrl`                                                                                                                                             |
| Manual review      | result per checklist item            | the person running [verify.md](verify.md), recorded in rationale (AC-13)                                                                                         |

**Key invariants**:

- Lighthouse and axe seed through the same `seedVisitor`; no second copy of the storage keys.
- Every Lighthouse floor is in [0.95, 1.00]; lowering one below its locked value needs a reason in rationale, as with spec 0003.
- No axe rule is disabled outside `axe-exceptions.ts`, and every exception has a reason.
- Scans never edit the app: fixes land in `src/`, the scripts only observe.
- The app keeps the `theme`, `lang` and `viewport` queries in the URL but never reads them; only the seed does.

**Security model**: no change. Scripts run locally and in CI against `localhost`; reports stay in workflow artifacts and nothing is uploaded outside GitHub (spec 0003). The fixture resume is fake data.

**Configuration required**: none new. `CHROME_PATH` (already set for Lighthouse in CI) is reused by the axe job.

**Critical test scenarios**:

- Happy path: `pnpm a11y` on the final branch runs 108 scans and exits 0; the job summary shows zero serious and critical everywhere, verifies **AC-1**, **AC-3**, **AC-5**, **AC-11**
- Failure: remove the accessible name from the theme toggle's `sr-only` text, run `pnpm a11y:scan`: it exits non zero and prints `button-name`, `critical`, `/`, each variant, verifies **AC-1**, **AC-2**, **AC-6**
- Failure: break the actions menu trigger's name: the open state scans for the actions menu and reset dialog fail and name the state, verifies **AC-5**
- Failure: an exception entry with an empty `reason` fails the script before scanning, verifies **AC-2**
- Seed: `/preview?lang=pl` in Lighthouse renders in Polish (`<html lang='pl'>`) with a saved resume, verifies **AC-8**
- Summary: unit test of the summary on a hand written manifest with mobile, PL, dark and desktop URLs gives one row each with the right floors, verifies **AC-9**, **AC-10**
- Matrix: unit test that the matrix holds 80 load scans and 28 open state scans with no duplicates, verifies **AC-3**, **AC-5**

## Build plan

Tracer Bullet: one thin scan runs end to end through script, report and CI first, then the matrix widens, then the fixing happens against a check that already blocks.

1. **Shared seed.** Move the visitor setup into `scripts/perf/seed-visitor.cjs`, make `lhci-seed.cjs` use it and read `lang` from the query. Existing audited URLs behave exactly as before. Satisfies **AC-4**, **AC-8**
2. **Thin axe thread.** Add `@axe-core/puppeteer` and an exactly pinned `axe-core`, write `scripts/a11y/axe-scan.ts` for one scan (`/`, EN, light, phone, returning) with the console list, job summary, JSON report, `axe-exceptions.ts` check, `pnpm a11y` and `pnpm a11y:scan`, `.a11y/` ignores, and the CI `accessibility` job with its artifact, marked `continue-on-error` for now. Satisfies **AC-1**, **AC-2**, **AC-6**, **AC-7**
3. **Full load matrix.** `axe-matrix.ts` with all 80 load scans, first visit seeding, the fresh context per scan, the waits and `<html lang>` check from AC-4, `CONCURRENCY` at a time, plus unit tests for the matrix and summary. Satisfies **AC-3**, **AC-4**
4. **Open states.** The seven open state scans in four variants each, failing loudly on a missing trigger. Satisfies **AC-5**
5. **Wider Lighthouse.** Variant URLs and per variant runs and assertions in `lighthouserc.cjs`, `lighthouserc.desktop.cjs`, the four step `pnpm perf:lhci`, the summary showing every URL, provisional 0.95 floors. Satisfies **AC-8**, **AC-9**
6. **Fix pass.** Fix every serious and critical axe violation and every Lighthouse score below 0.95 the new checks find, trace the `/builder` CSP issue, then remove `continue-on-error` from the `accessibility` job. Satisfies **AC-7**, **AC-11**, **AC-12**, **AC-14**
7. **Manual review.** Run the [verify.md](verify.md) checklist, fix what fails, record results. Satisfies **AC-13**, **AC-14**
8. **Lock and record.** Set floors from the first green CI run after the fix pass, record the baseline and run id in rationale, add exported PDF accessibility to the scope's Deferred list. Satisfies **AC-10**, **AC-15**

## Consequences

**Positive**:

- Accessibility gets a hard gate by impact, not just a weighted Lighthouse score that a single serious issue barely moves.
- Polish, dark, first visit and the desktop PDF path are all checked for the first time.
- The stale 0.68 and 0.90 floors from spec 0003 are gone; nothing can slide below 0.95 again.

**Negative / tradeoffs**:

- CI gets slower: Lighthouse goes from 18 to about 36 runs (roughly 6 to 7 minutes instead of 3.5), and the axe job adds a few minutes in parallel.
- Open state scans depend on accessible names in the UI; renaming a trigger means updating the scan, and a broken scan blocks a PR until fixed.
- One run per non English or dark variant means performance on those is not gated; a performance regression that only hits PL or dark would pass.
- One more dev dependency (`@axe-core/puppeteer` with `axe-core`) to keep updated; a new axe version can add rules that fail CI without an app change.
- Tighter floors (median minus 0.02, performance minus 0.05) catch real regressions but may flake on a noisy runner more often than 0.90 did.
- Scans see the reduced motion render only; a contrast bug that exists only mid animation is left to the manual review.
- Desktop performance has no gate until three CI runs of it exist.

**Neutral**:

- Spec 0003's floors and AC-6 page list are extended, not replaced; its floor comments now point here.
- Manual review results live in rationale, as spec 0003 did for its baseline.

## Follow-up

- [ ] `/sync`: add `pnpm a11y` / `pnpm a11y:scan` and the `accessibility` CI job to root `AGENTS.md` Commands, and note `scripts/a11y/` next to `scripts/perf/`.
- [ ] Watch the first few weeks of CI for flaky Lighthouse failures on the tighter floors; if one URL flakes, widen only its margin with a reason.
