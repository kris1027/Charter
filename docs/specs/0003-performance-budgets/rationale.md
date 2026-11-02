# 0003. Performance budgets: rationale

## Context

Nothing in CI checks size or speed today. The CI job runs format, lint, tests and the build, and a PR can add hundreds of kB to a page without anyone seeing it. Spec 0001 recorded chunk sizes in a PR (AC-10) for information only. The scope's later features depend on a yardstick: feature 10 (lazy load heavy engines) must keep every page within its JS budget, and feature 16 must reach Lighthouse 95+ in all four categories.

The app is a client only SPA on Vercel. TanStack Router's `autoCodeSplitting` gives each route its own chunk, but the PDF engine (`@react-pdf/renderer`, about 357 kB brotli) is still a static import of `/preview` and `/templates/$templateId`, so those pages start at about 556 kB. Vercel serves static assets brotli compressed. The PWA precaches about 8 MB.

Forces: the maintainer is solo, so the setup has to stay small and cheap to run. Lighthouse scores on shared CI runners vary from run to run. The real scores aren't at 95 yet, so a hard 95 gate now would keep CI red until slice 3 ships. `/preview` shows an empty "no data" screen with empty storage, so measuring it as is would hide its real cost.

## Options considered

### Option 1: size-limit plus Lighthouse CI

`size-limit` with per file glob budgets, plus `@lhci/cli`.

**Pros**: a well known tool with ready made CI reporting.
**Cons**: it budgets files, not pages, so it can't add up a route's static import closure. Chunk names change when feature 10 splits code, so the globs break just when budgets matter most. It's one more dependency for something a short script can do.

### Option 2: own manifest based size check plus Lighthouse CI on `vite preview` (chosen)

A short Node script reads `dist/.vite/manifest.json`, walks each route's static imports, compresses with brotli and compares the result against `perf/budgets.json`. `@lhci/cli` runs in its own job against `vite preview`.

**Pros**: budgets are per page, which is what users feel. No dependency for the size check. It survives chunk renames. Lighthouse runs the same way locally and in CI, with no wait for a deploy.
**Cons**: about 100 lines of our own code to maintain. It relies on Vite's manifest format and TanStack's `?tsr-split=component` key naming. `vite preview` lacks Vercel's headers.

### Option 3: Lighthouse budgets only (`budget.json` resource sizes)

Use Lighthouse's own `resource-summary` budgets for both size and scores.

**Pros**: one tool and one config.
**Cons**: the sizes come from a throttled, noisy browser run, not the build, so they're slow to check and can't run in pre-commit. They also count what got transferred during the run, which includes lazy chunks the page happened to fetch.

### Option 4: Lighthouse against Vercel preview deployments

Same as Option 2, but audit the Vercel preview URL instead of `vite preview`.

**Pros**: real CDN, compression and headers.
**Cons**: CI has to wait for the deploy, get past deployment protection, and depends on Vercel being up. Fork PRs get no preview.

## Rationale

The budget has to be per page because feature 10's whole job is to move bytes from a page's first load into lazy chunks. A per file tool (Option 1) or a "everything the browser fetched" number (Option 3) wouldn't move when that work succeeds. Reading the build manifest is deterministic and fast, which is why the size check can run in pre-commit. Brotli at quality 11 is close to what Vercel actually sends.

Lighthouse is kept, but only for what it does better: category scores. Running it against `vite preview` (rather than Option 4) keeps CI independent of the deploy and works the same on a laptop. The floors are set at the measured median minus 2 points, with a warning at 95, so CI can fail on regressions today without staying red until feature 16. Seeding the sample resume and clearing the service worker before each audit makes `/preview` and `/builder` show their real cost, and stops cached runs from flattering the score.

The floors are relative to this setup, not production scores. `vite preview` serves assets uncompressed and without Vercel's headers, so Performance and Best Practices here read lower than on the live site. What the floors catch is change between PRs, which is the job.

Builder render cost stays a recorded baseline, not a gate. Timing on shared runners is too noisy to gate on, and feature 11 owns tuning it.

## Baseline

### Per route initial JS (brotli, quality 11, KiB), measured 2026-11-02 on `main` at `eddb8b5`

| Route                               | Initial JS | Budget (+5%, rounded up) |
| ----------------------------------- | ---------- | ------------------------ |
| `/`                                 | 200.1      | 211                      |
| `/templates`                        | 210.5      | 222                      |
| `/templates/$templateId`            | 558.5      | 587                      |
| `/builder`                          | 257.1      | 270                      |
| `/preview`                          | 555.9      | 584                      |
| Entry closure alone (shared by all) | 190.6      | n/a                      |

Largest chunks (brotli KiB): `veterinary-pdf` (the `@react-pdf` engine; Rolldown named it after its first importer) 356.6, `pdf` 103.6, `index` 72.5, `builder` 58.7. Chunk cap: 375. CSS: one file, 12.7 KiB (not budgeted). PWA precache: 133 entries, 8072.71 KiB.

### Lighthouse medians and floors

From the first green `lighthouse` run on `main`: CI run `41433413867` at `cb2f293` (2026-11-02), mobile, 3 runs per page. Each cell is median / floor, where the floor is the median minus 0.02, rounded down.

| Page                   | Perf        | A11y        | Best practices | SEO         |
| ---------------------- | ----------- | ----------- | -------------- | ----------- |
| `/`                    | 1.00 / 0.98 | 1.00 / 0.98 | 1.00 / 0.98    | 1.00 / 0.98 |
| `/templates`           | 0.98 / 0.96 | 1.00 / 0.98 | 1.00 / 0.98    | 0.92 / 0.90 |
| `/templates/developer` | 0.78 / 0.76 | 0.95 / 0.93 | 1.00 / 0.98    | 0.92 / 0.90 |
| `/builder`             | 0.99 / 0.97 | 0.92 / 0.90 | 0.96 / 0.94    | 0.92 / 0.90 |
| `/preview`             | 0.72 / 0.70 | 0.95 / 0.93 | 1.00 / 0.98    | 0.92 / 0.90 |

The medians are the true median of the 3 runs, the value LHCI's `aggregationMethod: 'median'` asserts against. They match the job summary except `/templates` performance: its runs scored 0.89, 0.98 and 0.99, the summary shows LHCI's representative run (0.99), and the median is 0.98.

### Builder render cost (informational)

To be filled in by build task 5: commits and total render ms for typing 20 characters into the summary field, from one Profiler recording.
