# Verify: Lazy load heavy engines · spec 0008 · updated 2026-11-05

_Steps derived from spec 0008 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] `pnpm build && pnpm exec vite preview`, open `/` with DevTools Network (JS) → no `react-pdf.browser-*`, `template-pdf-*`, `template-viewer-*`, `pdf-*` (pdf.js) or `.ttf` font requests; `motion-features-*` loads only after first paint → AC-1
- [ ] On `/`, scroll to the bottom → every fade in and parallax element ends visible (no element stuck at opacity 0), console has no LazyMotion strict error → AC-1
- [ ] With reduced motion turned on in the OS, reload `/` → content shows without entrance animation → AC-1
- [ ] Open `/templates/developer` → page shell and header paint first, then `lazy-template-viewer-*`, `template-viewer-*` and `react-pdf.browser-*` load and the PDF iframe appears → AC-2
- [ ] Seed `resumeData`, open `/preview?templateId=default` → placeholder text shows, then the PDF; a long resume still shows the multi page / single page toggle and switching it updates the PDF → AC-2
- [ ] Load `/preview` once online, go offline in DevTools, reload → preview renders and Download PDF saves a file → AC-3
- [ ] Offline, in `/builder` import a PDF exported by the app → the form fills → AC-3
- [ ] In DevTools Network, block the `motion-features-*.js` request, load `/`, scroll to the bottom → every section is fully visible, `<html>` has `data-motion-failed`, and the console shows no unhandled rejection → AC-6
- [ ] Throttle to a custom profile that holds `motion-features-*.js` past 8 seconds (or pause it with a breakpoint), load `/` → after 8 seconds `<html>` gets `data-motion-failed` and every entrance element shows → AC-6
- [ ] Normal load of `/` → `<html>` never gets `data-motion-failed`, and entrance fades still play once on scroll → AC-5

## Commands

- [ ] `pnpm build && pnpm perf:size` → every route and the chunk cap report `ok`, with `/` under 198 KiB and `/preview` under 188 KiB → AC-4
- [ ] `grep -c "motion-features\|react-pdf.browser\|template-viewer" dist/sw.js` → each lazy chunk is in the precache list → AC-3
- [ ] `pnpm pre-commit` → passes → AC-4
- [ ] Add a scratch file with `import { motion } from 'motion/react'` under `src/`, run `pnpm lint` → it fails with "Use `m` inside LazyMotion, not `motion` (spec 0008)"; delete the file → AC-7
- [ ] `pnpm build && pnpm perf:size` → no `lazy engine` problem lines, so all five `lazyEngines` entries match a manifest key → AC-8
- [ ] Temporarily add a static `import '@/lib/motion-features'` to a page, rebuild, run `pnpm perf:size` → it fails (the route goes over budget and the engine reads "matches no manifest key", since rolldown inlines it); revert → AC-8
- [ ] `pnpm exec vitest run src/app/motion-provider.test.tsx scripts/perf eslint.config.test.ts` → the fallback, stall, leak and lint tests pass → AC-6, AC-7, AC-8

## Acceptance-criteria coverage

- AC-1 covered by the first three UI steps · AC-2 by the template page and preview steps · AC-3 by the two offline steps and the `sw.js` check · AC-4 by `perf:size` and `pre-commit` · AC-5 by the reduced motion and normal load steps · AC-6 by the blocked file and stall steps plus `motion-provider.test.tsx` · AC-7 by the scratch lint step plus `eslint.config.test.ts` · AC-8 by the two `perf:size` steps plus `measure-routes.test.ts`
