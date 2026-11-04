# Verify: PDF import parser · spec 0007 · updated 2026-11-04

_Steps derived from spec 0007 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] On `/builder`, import a PDF exported from this app → the form fills exactly as exported (metadata path) → AC-1
- [ ] Print an exported developer, default and veterinary PDF (EN and PL) to a new PDF ("Save as PDF"), import each → the template, language dependent dates (`Obecnie`, Polish months), `Ojczysty` levels and the GDPR company come back → AC-1, AC-7, AC-8
- [ ] Import a password protected PDF → dialog shows the translated "password protected" message; the form keeps its values → AC-10
- [ ] Import a renamed `.txt` file as `.pdf` → "could not be opened as a PDF"; form unchanged → AC-2, AC-10
- [ ] Import a PDF from another tool (no known headers) → "does not look like a resume made with Resume Builder"; form unchanged → AC-4, AC-10
- [ ] Switch the UI to Polish and repeat one failure → the message is in Polish → AC-10

## Commands

- [ ] `pnpm vitest run --project pdf` → 19 tests pass (18 renders without metadata plus the metadata path) → AC-11
- [ ] `pnpm vitest run --project unit src/features/pdf` → every import module test passes → AC-2 to AC-10, AC-12, AC-13
- [ ] `pnpm templates:previews --baseline` on main, then `--diff` on the branch → text snapshots unchanged → AC-3
- [ ] `pnpm pre-commit` → green, `/builder` within its `perf:size` budget → AC-13
- [ ] `grep -r "@react-pdf/renderer" src/features/pdf/import` → only `round-trip.pdf.test.tsx` → AC-13

## Value sourcing

- [ ] Header name `Jan Maria Nowak` → firstName `Jan`, lastName `Maria Nowak`
- [ ] Title present vs absent (edges fixture) → `Staff Engineer` vs `''` (font size rule)
- [ ] Website `anna.dev` (no protocol) and `https://anna.dev/` → both read back exactly (link annotation)
- [ ] PDF without link annotations → GitHub and LinkedIn rebuilt from the printed handles (`header.test.ts`)
- [ ] Experience dates in PL short (`kwi 2013 - paź 2014`) and long (`luty 2011 - Obecnie`) → `2013-04`/`2014-10`, `current: true`
- [ ] Education years `2010 - 2014` → `2010-01`/`2014-01`
- [ ] Skill `React Native` beside `TypeScript` → two skills
- [ ] GDPR generic vs company clause, EN and PL → `companyName` `''` vs the printed company

## Acceptance-criteria coverage

- AC-1 manual 1 and 2, `load-resume.test.ts` · AC-2 `read-pdf-source.test.ts` · AC-3 `text-lines.test.ts`, preview `--diff` · AC-4 `detect-layout.test.ts` · AC-5 `section-headers.test.ts` · AC-6 `split-sections.test.ts` · AC-7 reader tests, round trip · AC-8 `dates.test.ts`, `read-gdpr.test.ts`, round trip PL · AC-9 `contact-links.test.ts` · AC-10 `builder-page.test.tsx`, manual 3 to 6 · AC-11 round trip · AC-12 ported cases in `detect-layout.test.ts`, `split-sections.test.ts` · AC-13 pre-commit, grep
