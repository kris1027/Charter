# Verify: Performance budgets · spec 0003 · updated 2026-11-02

_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## Commands

- [ ] `pnpm build && pnpm perf:size` → five route rows (`/`, `/builder`, `/preview`, `/templates`, `/templates/$templateId`) plus a `largest chunk` row, sizes in KiB with one decimal next to each budget, exit 0 → AC-1
- [ ] In a scratch edit, set `/builder.maxKb` to 200 in `perf/budgets.json`, run `pnpm perf:size` → exit 1 and `/builder: 257.1 KiB is over its 200 KiB budget`; revert → AC-2
- [ ] In a scratch edit, set `chunkCap.maxKb` to 300 → exit 1, the PDF engine chunk named with its size and the cap; revert → AC-2
- [ ] In a scratch edit, delete the `/builder` budget → exit 1, `/builder: no budget ... (measured 257.1 KiB)`; add a `/gone` budget → `stale budget`; blank a `reason` → `budget has no reason`; revert → AC-3
- [ ] `pnpm vitest run scripts` → the closure test (shared chunk counted once, dynamic import left out), the path mapping tests and the `_layout.tsx` throw all pass → AC-3, AC-4
- [ ] `GITHUB_STEP_SUMMARY=/tmp/s.md pnpm perf:size` → `/tmp/s.md` holds the Markdown route table; same with a scratch over budget edit (written before the non zero exit) → AC-5
- [ ] Open a PR → the `Lint, Format, Test & Build` job runs `JS size budgets` after `Build`, its job summary shows the table, and it uploads the `dist` artifact → AC-5
- [ ] The `Lighthouse` job on that PR runs after the build job, audits the five pages 3 times each, fails only when a median is below its floor, prints one `::warning::` per median under 0.95, and uploads `lighthouse-reports` (14 days). Nothing goes to LHCI public storage → AC-6
- [ ] In a scratch edit, raise one page's performance floor in `lighthouserc.cjs` above its median → the `Lighthouse` job fails while the build job stays green; revert → AC-6
- [ ] In the Lighthouse job log, the seed runs once before every single run (15 url entries, each `Run #1`) → AC-7
- [ ] In a scratch edit, stop the seed script writing `resumeData`, run `pnpm exec lhci collect --url=http://localhost:4173/preview` → fails with `Seeding failed: /preview did not render the export button within 10 s`; revert → AC-7
- [ ] `pnpm pre-commit` → ends with the `perf:size` table and exit 0; neither LHCI command runs in it → AC-8
- [ ] With `CHROME_PATH` set, `pnpm perf:lighthouse` → builds, runs LHCI, prints the medians table; afterwards `pnpm format:check` and `pnpm lint` still pass and `git status` shows no new tracked files → AC-8
- [ ] `docs/specs/0003-performance-budgets/rationale.md` `## Baseline` holds the per route JS sizes, the first green `main` run's Lighthouse medians with the floors derived from them, and one builder Profiler recording → AC-9

## Value sourcing

- [ ] Entry chunk: the manifest has exactly one `isEntry` chunk (`index.html`); a manifest with none makes `measureRoutes` throw → entry source
- [ ] Route chunks: every `src/routes/*?tsr-split=component` key gets a row; `__root` gets none → route source
- [ ] Route path: `templates_.$templateId.tsx` shows as `/templates/$templateId`, `index.tsx` as `/` → path mapping
- [ ] Chunk size: brotli of `dist/assets/<file>` at default quality; `/builder` reads 257.1 KiB on today's build (not the gzip or raw size Vite prints) → size source
- [ ] Largest chunk: the row names the biggest `.js` file across all chunks, lazy ones included (today `veterinary-pdf-*.js`, 356.6 KiB) → largest chunk source
- [ ] Budget and reason: change a reason in `perf/budgets.json` and nothing else changes in the output; blank it and the check fails → budget source
- [ ] URLs audited: the LHCI log lists `/templates/developer` (the first id in `src/lib/template-ids.ts`) → URL source
- [ ] Score per page: the summary's numbers equal the `isRepresentativeRun` entries in `.lighthouseci/reports/manifest.json` → score source
- [ ] Floor per page: after task 4, each floor equals the first green `main` median minus 0.02, rounded down, and matches the rationale.md table → floor source
- [ ] Warning threshold: a median of exactly 0.95 gives no warning, 0.94 gives one → threshold
- [ ] Resume data: change `sampleResumeData` without touching `perf-resume.json` → `pnpm test` fails in `src/test/fixtures/perf-resume.test.ts` → fixture source
- [ ] Preview origin: with port 4173 already taken, `pnpm perf:lhci` fails loudly (`--strictPort`) instead of auditing another port → origin source
- [ ] Other storage keys: in a saved LHCI report for `/`, no privacy notice and no PWA install prompt show, and the page is in English → storage keys
- [ ] Export button: the download PDF button on `/preview` carries `data-testid='export-pdf'` → seed guard source

## Acceptance-criteria coverage

- AC-1: commands step 1 · AC-2: steps 2, 3 · AC-3: steps 4, 5 · AC-4: step 5 · AC-5: steps 6, 7 · AC-6: steps 8, 9 · AC-7: steps 10, 11 · AC-8: steps 12, 13 · AC-9: step 14 (open until build tasks 4 and 5)
