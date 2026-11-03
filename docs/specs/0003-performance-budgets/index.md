# 0003. Performance budgets: per page JS size and Lighthouse floors enforced in CI

**Date**: 2026-11-02
**Status**: Accepted

## Summary

This spec adds two checks that fail CI when the app gets slower. The first is a small script that adds up the JavaScript each page loads up front (brotli compressed, the way Vercel serves it) and compares it to a budget file. The second is Lighthouse CI, which scores five pages on a simulated phone and fails when a score drops below today's level. Budgets start at today's measured size plus 5%, so CI passes now and any real growth fails. Feature 10 (lazy loading) then lowers them. Raising a budget means editing a committed file and giving a reason, which shows up in review.

## Requirements

**User stories**:

- As the maintainer, I want CI to fail when a page's JavaScript grows past its budget so that a heavy dependency can't slip in unnoticed.
- As the maintainer, I want Lighthouse scores checked on every PR so that the 95+ goal (feature 16) can't quietly slip backwards.
- As the maintainer, I want raising a budget to be a visible, reasoned edit so that I know later why a number went up.

**Acceptance criteria**:

- **AC-1**: After `pnpm build`, `pnpm perf:size` prints, for each of the five routes, its initial JS size (brotli, KiB, one decimal) next to its budget, plus the largest single JS chunk next to the chunk cap. It exits 0 when everything is within budget.
- **AC-2**: `pnpm perf:size` exits non zero when any route's initial JS is over its `maxKb`, or any single `.js` chunk is over `chunkCap.maxKb`. The output names each offender with its measured size and its budget.
- **AC-3**: `pnpm perf:size` exits non zero, printing the route and its measured size, when the manifest contains a route chunk with no entry in `perf/budgets.json`. It also fails when a budget key matches no route chunk (a stale budget), when any budget entry has a missing or empty `reason`, and when a route file name doesn't fit the mapping rules (instead of guessing a path).
- **AC-4**: A route's initial JS is the entry chunk plus the route's `?tsr-split=component` chunk plus every chunk reachable from those two through static `imports`, each counted once. Chunks reachable only through `dynamicImports` are not counted. Unit tests on a hand written manifest prove the dedupe and the dynamic import exclusion.
- **AC-5**: The existing CI job runs `pnpm perf:size` right after `pnpm build`. A failure fails the job, and the route table is written to the GitHub job summary in both the passing and the failing case (the summary is written before the script exits).
- **AC-6**: A separate `lighthouse` CI job runs Lighthouse CI against `vite preview` on mobile settings, three runs per URL, over `/`, `/templates`, `/templates/developer`, `/builder` and `/preview`. It fails when any category's median (performance, accessibility, best practices, SEO; LHCI `aggregationMethod: 'median'`) falls below that page's recorded floor. For every median below 0.95 it emits a GitHub `::warning::` annotation without failing. The HTML reports are uploaded as a workflow artifact kept for 14 days. Nothing is uploaded outside GitHub.
- **AC-7**: Before each Lighthouse run, the browser holds the sample resume under `resumeData`, plus `privacyNoticeAccepted`, `pwaInstallDismissed` and `language: 'en'`, with no service worker or Cache Storage left over from an earlier run. All five pages are audited in this seeded state (a returning visitor). When the audited URL is `/preview` and the export button (`data-testid='export-pdf'`) doesn't render within 10 s after seeding, the job fails instead of auditing the empty page.
- **AC-8**: `pnpm pre-commit` runs `pnpm perf:size` after the build. `pnpm perf:lighthouse` builds and then runs `pnpm perf:lhci` (Lighthouse CI on the existing `dist`) locally; neither is part of pre-commit. Running it locally leaves no file that breaks `format:check` or `lint`.
- **AC-9**: The baseline is recorded in [rationale.md](rationale.md#baseline): per route JS sizes (measured 2026-11-02), the Lighthouse medians from the first CI run with the floors derived from them, and one React Profiler recording of typing in the builder (informational, never enforced).

## Decision

**Chosen option**: Option 2: own manifest based size check plus Lighthouse CI on `vite preview`.

Per page JS budgets are checked by a small Node script that reads Vite's build manifest. Lighthouse category floors are enforced by `@lhci/cli` in its own GitHub Actions job, against the built app served by `vite preview`, with reports kept as private workflow artifacts.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch** (committed config files, no runtime data):

`perf/budgets.json`, the size budgets (source of truth, edited by hand in PRs):

```json
{
    "compression": "brotli",
    "routes": {
        "/": { "maxKb": 211, "reason": "baseline 2026-11-02 (200.1) +5%" },
        "/templates": { "maxKb": 222, "reason": "baseline 2026-11-02 (210.5) +5%" },
        "/templates/$templateId": { "maxKb": 587, "reason": "baseline 2026-11-02 (558.5) +5%" },
        "/builder": { "maxKb": 270, "reason": "baseline 2026-11-02 (257.1) +5%" },
        "/preview": { "maxKb": 584, "reason": "baseline 2026-11-02 (555.9) +5%" }
    },
    "chunkCap": { "maxKb": 375, "reason": "largest chunk, @react-pdf engine (356.6) +5%" }
}
```

| Field                        | Type                      | Required | Rule                                                                                                                                         |
| ---------------------------- | ------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `compression`                | `"brotli"`                | yes      | The only value allowed for now; the script rejects anything else                                                                             |
| `routes`                     | map: URL path to entry    | yes      | Keys are TanStack route paths. Every route chunk in the manifest needs a key; a key with no matching chunk is also an error (a stale budget) |
| `routes[path].maxKb`         | positive number (KiB)     | yes      | Brotli size of the route's initial JS                                                                                                        |
| `routes[path].reason`        | non empty string          | yes      | Why the number is what it is                                                                                                                 |
| `chunkCap.maxKb` / `.reason` | number / non empty string | yes      | Cap on any single `.js` chunk, lazy ones included                                                                                            |

Route path to manifest key mapping (derived from the TanStack file route naming in `src/routes/`): `/` maps to `index.tsx`, `/templates/$templateId` maps to `templates_.$templateId.tsx`, every other path `/x` maps to `x.tsx`. The manifest key is `src/routes/<file>?tsr-split=component`. The script derives the path from the file name with these rules: `index` becomes `/`, `.` becomes `/`, a trailing `_` on a segment is dropped, and `$name` stays as is. It does not keep a hand written table. A file name with anything else (a leading `_` layout segment, a bare `$` splat, `(group)`, `-` prefixed) throws with the file name, so a new route style forces a rule update instead of a wrong guess. `__root.tsx` isn't split today (checked in the 2026-11-02 manifest). If it ever appears, it's ignored as a route, because the entry closure already covers the root.

`lighthouserc.cjs`, the Lighthouse CI config:

- `collect.url`: absolute URLs `http://localhost:4173/`, `/templates`, `/templates/developer`, `/builder`, `/preview`.
- `collect.numberOfRuns: 3` and the mobile preset (the Lighthouse default).
- `collect.startServerCommand: 'pnpm exec vite preview --port 4173 --strictPort'`, `startServerReadyPattern: 'Local:'`, `startServerReadyTimeout: 30000`.
- `collect.puppeteerScript: './scripts/perf/lhci-seed.cjs'`.
- `collect.settings.disableStorageReset: true` (otherwise Lighthouse wipes the seeded storage), `collect.settings.chromeFlags: '--no-sandbox --headless=new'`.
- `collect.chromePath` and `collect.puppeteerLaunchOptions.executablePath`: `process.env.CHROME_PATH`, which CI sets to `/usr/bin/google-chrome` (preinstalled on `ubuntu-latest`). Locally you set it to your own Chrome.
- `upload.target: 'filesystem'`, `upload.outputDir: '.lighthouseci/reports'`.
- Floors sit in one object at the top of the file, `{ [urlPath]: { performance, accessibility, 'best-practices', seo } }` (scores 0 to 1). They're turned into an `assertMatrix` with one entry per URL, `matchingUrlPattern` anchored (`^http://localhost:4173/templates$`; `/` becomes `^http://localhost:4173/$`), every category at `['error', { minScore: floor, aggregationMethod: 'median' }]`. There's no second matrix entry for 0.95, so no URL ever matches two entries. The 0.95 warning comes from `scripts/perf/lighthouse-summary.ts` (below).

`src/test/fixtures/perf-resume.json`: `JSON.stringify(sampleResumeData)` from `src/features/resume/sample-resume-data.ts` (the EN sample), which the seed script writes to `resumeData`. No `templateId` in it; the template comes from the URL (`/preview` falls back to `developer`).

**API surface** (scripts and CI entry points; no HTTP API):

| Entry point                                                                     | Kind                                                                                      | Key inputs                                                                                                               | Key outputs                                                                                                                                                                                                                                                                                                                                  | Auth                  | Key errors                                                                                                                  |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm perf:size` → `node scripts/perf/check-bundle-size.ts`                     | CLI                                                                                       | `dist/.vite/manifest.json`, `dist/assets/*.js`, `perf/budgets.json`                                                      | Route table on stdout; same table as Markdown appended to `$GITHUB_STEP_SUMMARY` when that variable is set; exit 0 or 1                                                                                                                                                                                                                      | none                  | Missing manifest (tells you to run `pnpm build` first), over budget, missing budget entry, stale budget entry, empty reason |
| `measureRoutes(manifest, sizeOf)` in `scripts/perf/measure-routes.ts`           | pure function                                                                             | parsed manifest, `(file) => bytes`                                                                                       | `{ routes: { path, files, bytes }[], chunks: { file, bytes }[] }`                                                                                                                                                                                                                                                                            | none                  | Throws on no `isEntry` chunk, or on an import key missing from the manifest                                                 |
| `checkBudgets(measured, budgets)` in the same module                            | pure function                                                                             | measured result, parsed budgets                                                                                          | `{ ok, rows, problems: string[] }`                                                                                                                                                                                                                                                                                                           | none                  | none (problems are data)                                                                                                    |
| `pnpm perf:lhci` → `lhci autorun`                                               | CLI                                                                                       | `lighthouserc.cjs`, existing `dist/`                                                                                     | `.lighthouseci/` reports, assertion results, exit code                                                                                                                                                                                                                                                                                       | none                  | Assertion failure, preview server not starting, seed check failing                                                          |
| `pnpm perf:lighthouse` → `pnpm build && pnpm perf:lhci; pnpm perf:lhci-summary` | CLI                                                                                       | source                                                                                                                   | as above                                                                                                                                                                                                                                                                                                                                     | none                  | as above                                                                                                                    |
| `pnpm perf:lhci-summary` → `node scripts/perf/lighthouse-summary.ts`            | CLI; in CI a separate step with `if: always()`, so it runs even when `lhci autorun` fails | `.lighthouseci/reports/manifest.json` (representative runs and their summary scores), the floors from `lighthouserc.cjs` | Markdown table (page × category: median, floor) to `$GITHUB_STEP_SUMMARY`; one `::warning::` line per median below 0.95; always exits 0                                                                                                                                                                                                      | none                  | Missing manifest: prints a note, exits 0 (the failure belongs to LHCI)                                                      |
| `scripts/perf/lhci-seed.cjs`                                                    | LHCI puppeteer script `(browser, { url })`                                                | the URL about to be audited, the fixture JSON (read with `fs`)                                                           | Seeded storage on the preview origin                                                                                                                                                                                                                                                                                                         | none                  | Throws when the audited URL's path is `/preview` and `[data-testid='export-pdf']` doesn't render within 10 s                |
| CI job `lint-format-test-build` (existing)                                      | GitHub Actions                                                                            | push or PR to `main`                                                                                                     | new step `pnpm perf:size` after Build; uploads `dist` as artifact `dist` (1 day retention; `upload-artifact` leaves out the dot folder `dist/.vite` by default, which Lighthouse doesn't need)                                                                                                                                               | repo token, read only | size failure                                                                                                                |
| CI job `lighthouse` (new, `needs: lint-format-test-build`)                      | GitHub Actions                                                                            | the `dist` artifact                                                                                                      | checkout, pnpm setup, setup-node, `pnpm install --frozen-lockfile` (`vite preview` loads `vite.config.ts` and its plugins), download `dist`, then `pnpm perf:lhci` with `CHROME_PATH=/usr/bin/google-chrome`, then `pnpm perf:lhci-summary` (`if: always()`), then upload `.lighthouseci/` as `lighthouse-reports` (14 days, `if: always()`) | repo token, read only | assertion failure                                                                                                           |

Seed script steps, on every call (LHCI calls it before each run): open a new page, `goto('http://localhost:4173/')`, unregister every service worker, delete every Cache Storage entry, `localStorage.clear()`, then write `resumeData` (the fixture), `privacyNoticeAccepted: 'true'` (the value `src/app/privacy-notice.tsx` writes), `pwaInstallDismissed: 'true'` and `language: 'en'`. If the audited URL's path is `/preview`, `goto` it and wait for `[data-testid='export-pdf']`. The "no data" screen returns early without that button, so the guard tells the two apart. Finally `goto('about:blank')` and close the page.

**Value sourcing**:

| Action      | Value produced / displayed                 | Source                                                                                                                                                                           |
| ----------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| perf:size   | Which chunk is the entry                   | Manifest chunk with `isEntry: true` (exactly one today)                                                                                                                          |
| perf:size   | Which chunks belong to a route             | Manifest keys `src/routes/*?tsr-split=component`, then the static `imports` closure from them and from the entry (AC-4)                                                          |
| perf:size   | Route path shown and matched to the budget | Derived from the route file name by the mapping rules above                                                                                                                      |
| perf:size   | Size of a chunk                            | `zlib.brotliCompressSync(file)` at Node's default quality (11) on `dist/<chunk.file>`, in bytes; shown as bytes / 1024 with one decimal                                          |
| perf:size   | Budget and reason                          | `perf/budgets.json`                                                                                                                                                              |
| perf:size   | Largest chunk                              | Max over every manifest chunk whose `file` ends in `.js`                                                                                                                         |
| Lighthouse  | URLs audited                               | `lighthouserc.cjs` list; the detail page uses `developer` (first id in `src/lib/template-ids.ts`)                                                                                |
| Lighthouse  | Score per category per page                | Median of 3 runs, chosen by LHCI's representative run                                                                                                                            |
| Lighthouse  | Floor per category per page                | First CI run's median minus 0.02, rounded down to two decimals, written into `lighthouserc.cjs` and rationale.md (build task 4)                                                  |
| Lighthouse  | Warning threshold                          | Fixed 0.95 from the scope's constraint; feature 16 raises the floors to it                                                                                                       |
| Seed script | Resume data                                | `src/test/fixtures/perf-resume.json` (kept equal to `sampleResumeData` by a test)                                                                                                |
| Seed script | Preview origin                             | Fixed `http://localhost:4173`, the same port as `startServerCommand` (`--strictPort` fails loudly if it's taken)                                                                 |
| Seed script | Other storage keys                         | `privacyNoticeAccepted: 'true'` (as `src/app/privacy-notice.tsx` writes it), `pwaInstallDismissed: 'true'`, `language: 'en'` (the fixture is EN)                                 |
| Seed guard  | Export button                              | `data-testid='export-pdf'`, added to the download PDF button in `src/features/preview/preview-page.tsx`                                                                          |
| Lighthouse  | Warnings below 0.95                        | `scripts/perf/lighthouse-summary.ts` reading LHCI's report manifest                                                                                                              |
| Baseline    | Builder render cost                        | One React DevTools Profiler recording on `pnpm preview`, typing 20 characters into the summary field with the fixture loaded; commit count and total render ms, recorded by hand |

**Key invariants**:

- Every route chunk in the manifest has exactly one budget entry, and every budget entry matches a route chunk.
- Every budget entry has a non empty `reason`.
- The size check measures what users download: compression is brotli, files come from `dist`, and dynamic imports are left out of the initial JS.
- Lighthouse never audits an empty `/preview`: seeding is checked before every audit.
- Floors only change in a PR that edits `lighthouserc.cjs` and updates the baseline table in rationale.md.
- `build.manifest: true` writes `dist/.vite/manifest.json`. It must stay out of the PWA precache (Workbox's default glob doesn't match `.json` under a dot folder; check the precache list after the change).
- Out of budget scope: `public/pdf.worker.min.mjs` and other `public/` files. They're copied as is, aren't in the manifest, and change only on a `pdfjs-dist` upgrade.
- `.lighthouseci/` is listed in `.gitignore`, `.prettierignore` and the ESLint `globalIgnores`.
- Tooling covers `scripts/`. `tsconfig.node.json` includes `scripts/**/*.ts`. ESLint gets a `scripts/**` block with `globals.node`, and `scripts/**/*.cjs` gets `sourceType: 'commonjs'`, so the seed script is linted too. Scripts import each other by relative `./x.ts` paths (the `@/` alias and the `../` ban apply only to `src/`). Tests in `scripts/` import `describe`, `it` and `expect` from `vitest` explicitly (the node tsconfig has no Vitest globals) and carry `// @vitest-environment node`. `src/test/setup.ts` only polyfills `ResizeObserver` and loads jest-dom matchers, which is safe in node.

**Security model**: No user data, secrets, or runtime code paths. CI jobs use the default read only `GITHUB_TOKEN`, and reports stay in private workflow artifacts (no LHCI public storage). `dist/.vite/manifest.json` gets deployed and becomes publicly readable on Vercel. It only lists chunk names that are already public, so this is accepted.

**Configuration required**:

- `CHROME_PATH`: the Chrome binary for LHCI and puppeteer. CI sets `/usr/bin/google-chrome`; locally you export your own. It isn't a secret.
- New dev dependencies: `@lhci/cli` and `puppeteer` (LHCI loads it for `puppeteerScript`). Pin both to versions at least two weeks old, as 0001 does. List `puppeteer: false` under `allowBuilds` in `pnpm-workspace.yaml`: pnpm 12 fails the install (`ERR_PNPM_IGNORED_BUILDS`) on any unreviewed build script, and `false` denies it explicitly. pnpm then skips its postinstall Chrome download, and the system Chrome from `CHROME_PATH` is used everywhere.

**Critical test scenarios**:

- Happy path: today's build with the budgets above, `pnpm perf:size` prints five rows and the chunk cap row, then exits 0. Verifies **AC-1**, **AC-5**.
- Over budget: lower `/builder.maxKb` to 200 in a scratch copy; the script exits 1 and names `/builder` with 257.1 vs 200. Verifies **AC-2**.
- Missing or stale entry: a unit test with a manifest holding an extra route chunk that isn't in the budgets fails with that path and its size; a budget key with no chunk fails as stale; an empty `reason` fails; a route file named `_layout.tsx` throws as unmapped. Verifies **AC-3**.
- Path mapping: unit tests map `index.tsx` to `/`, `templates_.$templateId.tsx` to `/templates/$templateId`, `builder.tsx` to `/builder`. Verifies **AC-3**, **AC-4**.
- Closure math: a unit test with a manifest of entry → shared, route → shared + routeOnly, route ⇢ (dynamic) lazy expects route bytes = entry + shared + route + routeOnly, with shared counted once and lazy not counted. Verifies **AC-4**.
- Seed guard: point the seed script at an origin with a broken fixture; the job fails with the seed error, not with a passing score. Verifies **AC-7**.
- Floor breach: temporarily raise one page's performance floor above its median in a PR; the `lighthouse` job fails while the other job stays green. Verifies **AC-6**.
- Fixture drift: a Vitest test in `src/test/fixtures/` asserts `perf-resume.json` deep equals `JSON.parse(JSON.stringify(sampleResumeData))` and parses with the schema from `resume-schema.ts`. Changing the sample or the saved shape without updating the fixture fails `pnpm test`. Verifies **AC-7**.
- Warning path: `lighthouse-summary.ts` given a report manifest with one median at 0.9 prints one `::warning::` line and exits 0. Verifies **AC-6**.

## Build plan

Tracer Bullet: the size check lands end to end first (measure, budget, CI, pre-commit), then Lighthouse lands in report only mode, then its floors get locked in. The app and CI stay green after every step.

1. Size check thread: set `build.manifest: true` in `vite.config.ts`; add `scripts/perf/measure-routes.ts` (pure `measureRoutes`, `checkBudgets` and the path mapping) with co-located `measure-routes.test.ts`; add the CLI `scripts/perf/check-bundle-size.ts` and `perf/budgets.json` with the numbers above. Wire up the `scripts/` tooling from Key invariants (tsconfig, ESLint block, Vitest `include` gets `scripts/**/*.test.ts`). Add a `perf:size` script. Check the real manifest keys match the mapping and that the manifest isn't in the precache. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**.
2. Wire it in: add a `pnpm perf:size` step after Build in `ci.yml` (with the job summary output), append it to `pre-commit`, and upload `dist` as an artifact for the next job. Add a short "Performance budgets" note to `CONTRIBUTING.md` on how to raise a budget (edit `perf/budgets.json` with a reason). Satisfies **AC-5**, **AC-8**.
3. Lighthouse in report only mode: add `@lhci/cli` and `puppeteer`; add `lighthouserc.cjs` as described, with floors all set to 0 for now (so only the summary runs); add `scripts/perf/lhci-seed.cjs`, the `data-testid='export-pdf'` on the preview download button, `src/test/fixtures/perf-resume.json` and its drift test; add `scripts/perf/lighthouse-summary.ts` and its test; ignore `.lighthouseci/`; add the `perf:lhci`, `perf:lhci-summary` and `perf:lighthouse` scripts and the `lighthouse` job. In the first run's log, confirm the seed script runs before each of the 3 runs per URL. If LHCI calls it only once per URL, list each URL three times with `numberOfRuns: 1` instead, so every run gets a fresh seed, and keep median aggregation. Satisfies **AC-6** (runner, reports, warnings), **AC-7**, **AC-8**.
4. Lock the floors: read the medians from the first green `lighthouse` run on `main`, write the floors (median minus 0.02, rounded down) into `lighthouserc.cjs`, and record the medians and floors in rationale.md `## Baseline`. Satisfies **AC-6**, **AC-9**.
5. Builder render baseline: record one Profiler run as described in Value sourcing and add it to rationale.md `## Baseline`. Satisfies **AC-9**.

## Consequences

**Positive**:

- Any PR that adds a heavy dependency or pulls a lazy engine into a page's first load fails with the page named.
- Feature 10 gets a ready made yardstick: it lowers budgets as it splits code, and the ratchet holds the gain.
- Lighthouse regressions show up per PR, months before feature 16's final sweep.

**Negative / tradeoffs**:

- CI gets about 2 to 3 minutes longer (the Lighthouse job, though it runs after the build job and only blocks itself).
- Lighthouse scores on shared runners wobble; a 2 point margin plus the 3 run median absorbs most of it, but an occasional rerun may be needed.
- `vite preview` doesn't apply `vercel.json` headers, so Best Practices scores can differ slightly from production.
- `puppeteer` is a heavy dev dependency (possibly a Chrome download) used only by the seed script.
- Budgets keyed by route path mean a new route forces a budget edit in the same PR; that's on purpose, but it is friction.

**Neutral**:

- `dist/.vite/manifest.json` is now emitted and deployed.
- A new `scripts/` folder is typechecked through `tsconfig.node.json` and tested by Vitest.
- `AGENTS.md` needs the new commands and the budget rule; `/sync` owns that edit.

## Follow-up

- [ ] Feature 10 lowers the route budgets and the chunk cap once the PDF engine leaves `/preview` and `/templates/$templateId` initial loads.
- [ ] Feature 16 raises every floor to 0.95 in `lighthouserc.cjs` (the summary warnings then become failures) and adds the PL and dark mode sweep.
- [ ] Feature 16: consider the `web-quality-audit` Agent Skill (`addyosmani/web-quality-skills`) for fixing Lighthouse findings. No Lighthouse CI skill or official Lighthouse MCP server was credible as of 2026-11-02.
- [ ] `/sync`: add `pnpm perf:size` and `pnpm perf:lighthouse` to the Commands block and the "raise a budget with a reason" rule to Rules in root `AGENTS.md`.
