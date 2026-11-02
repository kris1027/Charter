# Verify: Design system refresh · spec 0004 · updated 2026-11-02

_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## Commands

- [ ] `pnpm vitest run src/lib/design-tokens.test.ts` → passes; every pair in _Contrast pairs_ is checked in light and dark → AC-1, AC-2
- [ ] In a scratch edit, set `.dark --muted-foreground` to slate 500 → the test fails naming `muted-foreground on muted (dark)` and a ratio under 4.5; revert → AC-2
- [ ] `grep -nE "chart-|sidebar-" src/index.css` → no matches; `:root` has `color-scheme: light`, `.dark` has `color-scheme: dark` → AC-1
- [ ] `pnpm vitest run src/lib/motion-tokens.test.ts` → passes; change `--duration-base` in CSS only → fails; revert → AC-7
- [ ] `grep -nE "fade-in-scale|slide-in-(left|right)|grow-width|shimmer|hover-lift" src` → no matches → AC-7
- [ ] `grep -rnE "shadow-(xs|sm|md|lg|xl|2xl)\b|outline-(none|hidden)" src/components/ui src/lib/button-variants.ts` → no matches; in `dist` CSS, `.shadow-surface` reads `var(--elevation-surface)` → AC-3, AC-8
- [ ] Add `className='text-slate-500'` to `src/app/root-layout.tsx` → `pnpm lint` fails with the spec 0004 message; the same edit in `src/features/landing/landing-page.tsx` → lint passes; revert both → AC-10
- [ ] `pnpm vitest run eslint.config.test.ts` → the bad literals error and the token classes pass → AC-10
- [ ] `pnpm vitest run src/app` → notice tests pass against the real Sonner, including the StrictMode single toast case → AC-6
- [ ] `pnpm pre-commit` → format, lint, test, build and `perf:size` all pass; any changed `maxKb` in `perf/budgets.json` has a reason naming spec 0004 → AC-11

## In the browser (`pnpm dev`, then light and dark, EN and PL)

- [ ] Fresh profile (clear site data): the privacy toast shows at the bottom center with no close button; swiping does nothing; Accept closes it; reload → it does not come back → AC-6
- [ ] DevTools Network offline → the offline warning toast appears; back online → it disappears and no new toast shows; reload while offline → it shows on load → AC-6
- [ ] With a waiting service worker (`pnpm build && pnpm preview`, change a file, rebuild) → the update toast offers Reload and Close; Reload activates the new version; Close hides it for this visit → AC-6
- [ ] Chrome with install available, flag unset → the install toast offers Install and Close; Install opens the browser prompt and closes the toast without saving the flag; after Close and reload it does not return → AC-6
- [ ] With privacy, offline and update active together → three separate, fully visible toasts, none overlapping, each button reachable by Tab → AC-6
- [ ] Tab through the builder (inputs, select, checkbox, date picker, buttons) and the dropdowns → each shows a 2px solid ring offset from the control; clicking with a mouse shows none → AC-3
- [ ] Every primitive renders in both themes with token colors; dark mode main buttons are indigo with dark text → AC-4
- [ ] Badge variants, a tooltip (hover, focus, Escape) and a segmented control (arrow keys move focus, Space selects, checked state announced, clicking the selected item keeps it) render correctly on a temporary scratch route (deleted afterwards) → AC-5
- [ ] With the OS set to reduce motion → no entrance animations, no floating shapes, toasts, popovers and dialogs appear and leave without transition → AC-7
- [ ] Cards show the `surface` shadow in light and none in dark; popovers, dialogs and toasts show `overlay` → AC-8
- [ ] Gallery card previews and an exported PDF for all three templates look identical to `main` → AC-11
- [ ] Switch to PL → the toast region is labeled `Powiadomienia` (screen reader or DevTools accessibility tree) → AC-11

## Docs

- [ ] `DESIGN.md` at the repo root lists every token with light and dark values and its tested pairs, each primitive with variants and sizes, the focus, motion, elevation and gradient rules, the toast API, the lint rule, and how to add a token → AC-9
