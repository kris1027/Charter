# Verify: Shared template model · spec 0006 · updated 2026-11-04

_Steps derived from spec 0006 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Open `/templates` in EN → three cards show `developer-en.webp`, `default-en.webp`, `veterinary-en.webp`, each with `width=1190`, `height=1684`, `loading=lazy` and an EN `alt` (`… template preview with sample resume`); the top of page 1 shows, with the bottom fade over the clipped edge → AC-9
- [ ] Switch to PL (or set the browser to `pl-PL`) → cards show the `-pl.webp` images and the PL `alt` (`Podgląd szablonu … z przykładowym CV`) → AC-9
- [ ] Open `/templates` once, go offline, reload → the cards still show (served from the `template-previews` runtime cache) → AC-10
- [ ] Open `/templates/default` in PL → the PDF prints Polish section titles (`DOŚWIADCZENIE ZAWODOWE`, `KLUCZOWE KOMPETENCJE`) over the Polish sample → AC-12
- [ ] In `/builder`, fill a resume, open `/preview`, export the PDF, then import it back → every field comes back (embedded metadata, `v: 1`) → AC-7
- [ ] Export a resume with GDPR on and a company name → the clause names the company and sits last; with a blank company → the generic clause → AC-6 (value: `gdpr`)
- [ ] Export with the developer template and website `https://x.dev/` → the header prints `x.dev`; with default or veterinary → it prints `https://x.dev/`, and no GitHub item appears even when GitHub is filled → AC-5 (values: contact `text`, `contactRows`)
- [ ] Export a job with `current` on, in EN and PL → the end date prints `Present` / `Obecnie`; a `NATIVE` language prints `Native` / `Ojczysty` → AC-5 (values: experience `end`, language `level`)

## Commands

- [ ] Before a template change: `pnpm templates:previews --baseline` → writes 60 renders to `.cache/template-baselines/` → AC-3
- [ ] After it: `pnpm templates:previews --diff` → `Template diff passed: 60 renders match the baseline` (zero changed pixels, same text, links and info fields) → AC-3, AC-4, AC-7
- [ ] Change one color in a template without regenerating, run `pnpm templates:previews --check` → exits 1 with `Template previews are stale, run pnpm templates:previews`; revert → exits 0 → AC-2
- [ ] `pnpm templates:previews` → writes six WebP files and `manifest.json`; `--check` then passes → AC-1, AC-2
- [ ] `pnpm test` → model tests (`resume-view.test.ts`, `printed-title.test.ts`) and the Polish parser cases pass, along with every existing `pdf-parser.test.ts` case → AC-5, AC-8, AC-13
- [ ] Add an id to `SECTION_IDS` and run `pnpm build` → fails in all three layouts and all three `renderers` maps until each handles it → AC-5, AC-6
- [ ] `pnpm pre-commit` → passes, with the previews check before the build → AC-2, AC-13
- [ ] `pnpm build && pnpm perf:size` → `/templates` within 222 KB; `dist/sw.js` has no `.webp` precache entry → AC-10
- [ ] `grep -r "templates/html" src` → no matches → AC-9

## Acceptance-criteria coverage

- AC-1 script and images: Commands 4 · AC-2 hash and `--check`: Commands 3, 4, 7 · AC-3 baseline and diff: Commands 1, 2 · AC-4 look unchanged: Commands 2 · AC-5 model: UI 7, 8, Commands 5, 6 · AC-6 renderers: UI 6, Commands 6 · AC-7 shared document and metadata: UI 5, Commands 2 · AC-8 parser titles: Commands 5 · AC-9 gallery images: UI 1, 2, Commands 9 · AC-10 runtime cache and budget: UI 3, Commands 8 · AC-11 font base: covered by Commands 1 (fonts load in Node) and UI 4 (browser unchanged) · AC-12 detail page: UI 4 · AC-13 tests, docs, pre-commit: Commands 5, 7
