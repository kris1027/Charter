# Scope: Charter

A free, no sign up resume builder for job seekers (EN/PL): fill a form, pick one of three print clean templates, export or import a PDF. This pass checks the stack, refactors toward modern practice, makes the app faster, and refreshes the app UI. The resume templates keep their current look.

**Build approach:** Tracer Bullet (each change lands end to end and working, so the app stays shippable after every step).
**Workflow:** Prototype (just `/develop`, nothing after it; you rely on its build time self check plus the existing vitest and pre commit checks). `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· Beta`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

**Constraints for this pass:** breaking the saved localStorage shape is allowed (no migration owed). Refreshed UI targets WCAG 2.2 AA and Lighthouse 95+ in every category. Templates stay white and print optimized; a new section still lands in all three.

## At a glance

| #   | Feature                         | Phase      | Status      |
| --- | ------------------------------- | ---------- | ----------- |
| A   | Landing page                    | Existing   | existing    |
| B   | Template gallery & detail       | Existing   | existing    |
| C   | Builder form                    | Existing   | existing    |
| D   | Resume templates & preview      | Existing   | existing    |
| E   | PDF export                      | Existing   | existing    |
| F   | PDF import                      | Existing   | existing    |
| G   | Local persistence               | Existing   | existing    |
| H   | i18n (EN/PL)                    | Existing   | existing    |
| I   | Theme (light/dark/system)       | Existing   | existing    |
| J   | PWA & offline                   | Existing   | existing    |
| K   | SEO                             | Existing   | existing    |
| 1   | Coding standards & AGENTS.md    | Foundation | done        |
| 2   | Stack review                    | Foundation | done        |
| 3   | Upgrades & replacements         | Foundation | done        |
| 17  | Unified radix-ui package        | Foundation | done        |
| 18  | Intl dates instead of date-fns  | Foundation | done        |
| 19  | Single CSP source               | Foundation | done        |
| 20  | React Compiler                  | Foundation | done        |
| 4   | Feature based folder structure  | Foundation | done        |
| 5   | Performance budgets             | Foundation | done        |
| 6   | Design system refresh           | Foundation | done        |
| 7   | Builder page split              | Slice 1    | done        |
| 8   | Shared template model           | Slice 1    | done        |
| 9   | PDF import parser restructure   | Slice 1    | done        |
| 10  | Lazy load heavy engines         | Slice 2    | done        |
| 11  | Builder responsiveness          | Slice 2    | done        |
| 12  | Landing page refresh            | Slice 3    | done        |
| 13  | Template gallery refresh        | Slice 3    | done        |
| 14  | Builder UI refresh              | Slice 3    | done        |
| 15  | Preview & export UI refresh     | Slice 3    | in-progress |
| 16  | Accessibility & Lighthouse pass | Slice 3    | planned     |

## Already built

### A. Landing page · existing

Marketing home with parallax decorative layers and entrance animations. code in `src/features/landing/`

### B. Template gallery & detail · existing

Template list and per template page with live previews. code in `src/features/gallery/`

### C. Builder form · existing

All resume sections with TanStack Form, Zod validation (i18n errors after touch), drag and drop reordering, GDPR clause toggle. code in `src/features/builder/`, `src/features/resume/`

### D. Resume templates & preview · existing

Default, Developer and Veterinary templates; preview in paged or single page mode. code in `src/features/templates/`, `src/features/preview/`

### E. PDF export · existing

React PDF versions of all three templates with embedded fonts. code in `src/features/pdf/pdf-export.tsx`, `src/features/templates/pdf/`

### F. PDF import · existing

Reads a previously exported PDF back into the form. code in `src/features/pdf/pdf-parser.ts`, `src/features/pdf/pdfjs-singleton.ts`

### G. Local persistence · existing

Autosave plus manual save and backup in localStorage. code in `src/lib/storage.ts`

### H. i18n (EN/PL) · existing

react-i18next with browser language detection. code in `src/i18n/`, `src/locales/`

### I. Theme (light/dark/system) · existing

code in `src/lib/theme-context.ts`, `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`

### J. PWA & offline · existing

Install prompt, reload prompt, offline indicator, strict CSP. code in `vite.config.ts`, `src/components/pwa-*.tsx`

### K. SEO · existing

Open Graph, Twitter cards, JSON LD, sitemap. code in `src/lib/seo.ts`, `public/`

## Foundations

### 1. Coding standards & AGENTS.md

Capture the real conventions (CLAUDE.md rules, folder layout, testing, i18n, template rules) in a root `AGENTS.md` so every later step reads the same context.
**Done when:** root `AGENTS.md` describes the current stack and conventions, and `CLAUDE.md` points to it.

- [x] Capture conventions: `/audit`

### 2. Stack review · done

Check every layer (build, router, forms, validation, UI primitives, animation, PDF render, PDF parse, dates, lint/format, tests, PWA) against current best practice and decide keep, upgrade, or replace for each.
**Done when:** a spec records a verdict and reason per layer, and every replacement is enrolled here as its own row.
spec [0001](../specs/0001-stack-review/index.md)

- [x] Design it (spec): `/architect stack review`

### 3. Upgrades & replacements · done

Apply the verdicts from the stack review one layer at a time, so tests and build stay green after each.
**Done when:** every "upgrade" verdict is applied, lint, tests, typecheck and build pass, and the app runs with no console errors.
spec [0001](../specs/0001-stack-review/index.md) (build plan steps 1 to 7 and 12)
code in `package.json`, `pnpm-workspace.yaml`, `vite.config.ts`, `eslint.config.js`, `src/features/templates/brand-icon-paths.ts`

- [x] Build it: `/develop upgrades & replacements`
    - [x] Runtime, pnpm 12 and dead code removal (step 1), AC-1, AC-9
    - [x] Toolchain: minors, TS 6, Vite 8, Vitest 5, ESLint 10 (steps 2 to 6), AC-1, AC-2, AC-4
    - [x] App library majors: i18next, motion 13, lucide 1, pdfjs 6 (step 7), AC-2, AC-3, AC-4, AC-6
    - [x] Final pass over the full check matrix (step 12), AC-2, AC-3, AC-4, AC-10

### 17. Unified radix-ui package · done · from spec 0001

Swap the seven `@radix-ui/react-*` packages for the single `radix-ui` package; same components, only import paths change.
**Done when:** no `@radix-ui/react-*` entry is left in `package.json` and every dialog, select, popover and menu works as before.
spec [0001](../specs/0001-stack-review/index.md) (build plan step 8). code in `src/components/ui/`

- [x] Build it: `/develop unified radix-ui package`

### 18. Intl dates instead of date-fns · done · from spec 0001

Format month and year with the browser's `Intl.DateTimeFormat` in the app and all three PDF templates, then drop `date-fns`.
**Done when:** a pinning test shows identical EN and PL output for all 12 months, and `date-fns` is gone.
spec [0001](../specs/0001-stack-review/index.md) (build plan step 9). code in `src/lib/date-utils.ts`, `src/features/templates/pdf/`

- [x] Build it: `/develop intl dates`

### 19. Single CSP source · done · from spec 0001

`vite.config.ts` reads the CSP from `vercel.json` instead of keeping its own copy.
**Done when:** the CSP string appears once in the repo, and the meta tag and deployed header match on a preview deployment.
spec [0001](../specs/0001-stack-review/index.md) (build plan step 10). code in `vite.config.ts`, `tsconfig.node.json`

- [x] Build it: `/develop single csp source`

### 20. React Compiler · done · from spec 0001

Turn on the React Compiler in the build and the tests, with the React hooks v7 lint rules.
**Done when:** the compiler runs in build and tests, lint reports compiler rules, and the builder behaves as before.
spec [0001](../specs/0001-stack-review/index.md) (build plan step 11). code in `vite.config.ts`, `vitest.config.ts`

- [x] Build it: `/develop react compiler`

### 4. Feature based folder structure · done

Move from type based folders (`components`, `lib`, `pages`) to feature areas (landing, templates, builder, preview, pdf) so later refactors land in clear homes.
**Done when:** each feature area owns its components, hooks and logic, shared code lives in one place, and imports follow one rule.
spec [0002](../specs/0002-feature-folder-structure/index.md). code in `src/features/`, `src/app/`, `eslint.config.js`

- [x] Design it (spec): `/architect folder structure`
- [x] Build it: `/develop folder structure`
    - [x] Baseline, lint rule and landing area as the first thread (AC-3, AC-7, AC-8)
    - [x] Page areas moved: gallery, builder, preview (AC-1, AC-2)
    - [x] PDF metadata untangled, pdf, templates and resume areas moved, context files updated (AC-1, AC-2, AC-5, AC-9)
    - [x] App shell, theme, dead code removed, README and final checks (AC-1, AC-4, AC-6, AC-7, AC-9)

### 5. Performance budgets · done

Measure today's bundle, Lighthouse scores and builder render cost, then set budgets the build enforces so later work cannot quietly regress.
**Done when:** a baseline is recorded in the spec, and the build or CI fails when a page's JS budget or Lighthouse threshold is broken.
spec [0003](../specs/0003-performance-budgets/index.md). code in `scripts/perf/`, `perf/budgets.json`, `lighthouserc.cjs`, `.github/workflows/ci.yml`, `src/test/fixtures/`

- [x] Design it (spec): `/architect performance budgets`
- [x] Build it: `/develop performance budgets`
    - [x] Per page JS size check wired into CI and pre-commit (AC-1, AC-2, AC-3, AC-4, AC-5, AC-8)
    - [x] Lighthouse CI job with seeded pages, reports and 95 warnings (AC-6, AC-7, AC-8)
    - [x] Lighthouse floors locked and the baseline recorded (AC-6, AC-9); the builder Profiler recording (build task 5) was skipped

### 6. Design system refresh · done

New visual language for the app shell (type, color, spacing, motion, components) in light and dark, meeting WCAG 2.2 AA. Templates are out of scope.
**Done when:** tokens and base components are defined and documented, contrast and focus states pass AA in both themes, and motion respects reduced motion.
spec [0004](../specs/0004-design-system-refresh/index.md) · code in `src/index.css`, `src/components/ui/`, `src/app/`, `src/lib/motion-tokens.ts`, `DESIGN.md`

- [x] Design it (spec): `/architect design system refresh`
- [x] Build it: `/develop design system refresh`
    - [x] Tokens, contrast test, focus rule and refreshed primitives (AC-1, AC-2, AC-3, AC-4, AC-8, AC-9)
    - [x] Sonner toasts replace the four shell banners (AC-6, AC-11)
    - [x] Lint guard plus badge, tooltip and segmented control (AC-3, AC-5, AC-10)
    - [x] Motion tokens, global reduced motion rule, DESIGN.md finished and final checks (AC-7, AC-9, AC-11)

## Slice 1: Refactor the core

### 7. Builder page split · done

Break the 788 line builder page into focused pieces with clear form state boundaries (form, section list, toolbar, import/save dialogs).
**Done when:** no builder file is over roughly 250 lines, each section owns its own state slice, and builder behavior is unchanged under the existing tests.
spec [0005](../specs/0005-builder-page-split/index.md) · code in `src/features/builder/`

- [x] Design it (spec): `/architect builder page split`
- [x] Build it: `/develop builder page split`
    - [x] Characterization tests for today's page, plus the save and clear writers (AC-1, AC-7)
    - [x] Typed form with field components and the shared sortable list (AC-3, AC-5, AC-6)
    - [x] Every section on withForm and array helpers, page callbacks gone (AC-3, AC-4, AC-5, AC-6)
    - [x] Autosave, PDF import, live progress and toolbar extracted, templateId validated (AC-7, AC-8, AC-9, AC-10)
    - [x] max-lines lint rule and final pre-commit and browser pass (AC-2, AC-11)

### 8. Shared template model · done

One description of each template's sections that drives both the web preview and the PDF version, so a new section is added in one place instead of six.
**Done when:** web and PDF output for all three templates come from the shared model, and both still match today's look.
spec [0006](../specs/0006-shared-template-model/index.md) · code in `src/features/templates/`, `src/features/gallery/`, `scripts/templates/`

- [x] Design it (spec): `/architect shared template model`
- [x] Build it: `/develop shared template model`
    - [x] Preview script with baseline and pixel diff of today's PDFs (AC-3, AC-4, AC-11)
    - [x] Shared model plus the default template on it (AC-5, AC-6, AC-7, AC-13)
    - [x] Gallery cards from prebuilt images, HTML templates deleted, stale check in pre-commit (AC-1, AC-2, AC-9, AC-10)
    - [x] Developer and veterinary on the model, parser reads model titles (AC-4, AC-6, AC-8)
    - [x] Detail page through TemplatePDF, docs and final pre-commit (AC-12, AC-13)

### 9. PDF import parser restructure · done

Split the 872 line parser into small, testable steps (extract text, detect template, map sections) so it is easier to extend when templates change.
**Done when:** each step is its own module with tests, and PDFs exported by all three templates still import correctly.
spec [0007](../specs/0007-pdf-import-parser/index.md) · code in `src/features/pdf/import/`

- [x] Design it (spec): `/architect pdf import parser`
- [x] Build it: `/develop pdf import parser`
    - [x] Round trip harness, one open, text runs, detect and split, developer readers live behind the new entry (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9, AC-11, AC-12)
    - [x] Default and veterinary readers, bridge removed (AC-7, AC-11)
    - [x] Polish dates and levels, GDPR recovery, typed translated errors (AC-6, AC-8, AC-10, AC-11)
    - [x] Old parser deleted, context files updated, final pre-commit (AC-12, AC-13)

## Slice 2: Make it fast

### 10. Lazy load heavy engines · done

Load the PDF renderer, pdf.js, fonts and the animation library only on the pages and actions that need them, within the budgets from feature 5.
**Done when:** the landing page ships none of those engines, export and import still work offline, and every page meets its JS budget.
spec [0008](../specs/0008-lazy-load-heavy-engines/index.md) · code in `src/app/motion-provider.tsx`, `src/features/templates/pdf/lazy-template-viewer.tsx`, `src/features/pdf/pdf-export.tsx`

- [x] Design it (spec): `/architect lazy load heavy engines: ratify the assumed LazyMotion decision`
- [x] Build it: `/develop lazy load heavy engines`
    - [x] Lazy PDF viewer, LazyMotion, motion chunk rule dropped, budgets lowered (AC-1, AC-2, AC-3, AC-4, AC-5)
    - [x] Motion load failure and stall fallback (AC-5, AC-6)
    - [x] Lint guard and engine leak check in `perf:size` (AC-7, AC-8)

### 11. Builder responsiveness · done

Keep typing smooth on long resumes and add a live PDF preview beside the form: fewer rerenders, autosave that also saves on hide, a preview built in a worker that never blocks input.
**Done when:** typing in any field on a long sample resume shows no dropped frames in a profile, autosave never runs on every keystroke, and the live preview updates without blocking input.
spec [0009](../specs/0009-builder-responsiveness/index.md) · code in `src/features/builder/`, `src/features/pdf/live-preview/`

- [x] Design it (spec): `/architect builder responsiveness`
- [x] Build it: `/develop builder responsiveness`
    - [x] Long fixture, before profile, and the worker tracer (go or no go) (AC-4, AC-5, AC-6, AC-7, AC-9)
    - [x] Live preview panel: client, debounce, page drawing, toggle, narrow sheet (AC-6, AC-8, AC-9, AC-10, AC-11, AC-15)
    - [x] Preview failure states (AC-12, AC-13)
    - [x] Card level redraws and autosave on hide (AC-1, AC-2, AC-3)
    - [x] Strings, offline check, worker size, after profiles (AC-5, AC-7, AC-14, AC-15) (offline check passed in Chromium and Safari)

## Slice 3: Refresh the UI

### 12. Landing page refresh · done

Rebuild the home page on the new design system, keeping parallax on decorative layers only.
**Done when:** the page uses the new tokens and components, reads well at phone width, and keeps its SEO metadata.
spec [0010](../specs/0010-landing-page-refresh/index.md) · code in `src/features/landing/`

- [x] Design it (spec): `/architect landing page refresh`
- [x] Build it: `/develop landing page refresh`
    - [x] Tokens, font, and the hero end to end (AC-1, AC-2, AC-3, AC-4, AC-5, AC-10, AC-11, AC-12, AC-13, AC-15)
    - [x] Statement, features, and how it works (AC-1, AC-6, AC-7, AC-12, AC-13, AC-15)
    - [x] Stats, closing section, footer, and removed strings (AC-8, AC-9, AC-15)
    - [x] Lint guard, cleanup, and `DESIGN.md` (AC-10, AC-17)
    - [x] SEO, motion failure, phone width, and performance checks (AC-14, AC-16, AC-18)

### 13. Template gallery refresh · done

Gallery and template detail pages on the new design system, with previews that load fast.
**Done when:** both pages use the new components, previews render without layout shift, and choosing a template still sets `?templateId=`.
spec [0011](../specs/0011-template-gallery-refresh/index.md) · code in `src/features/gallery/`

- [x] Design it (spec): `/architect template gallery refresh`
- [x] Build it: `/develop template gallery refresh`
    - [x] Gallery page end to end: nav, header, full sheet cards (AC-1, AC-3, AC-4, AC-5, AC-8, AC-9, AC-22)
    - [x] Saved resume notice and relative time (AC-10, AC-11, AC-18)
    - [x] Smaller card images through `srcset` (AC-6, AC-7, AC-20)
    - [x] Detail page: instant image, desktop PDF, phone image only (AC-12 to AC-17, AC-20, AC-22)
    - [x] Cleanup, lint guard, `DESIGN.md`, performance checks (AC-2, AC-18, AC-19, AC-21, AC-23)

### 14. Builder UI refresh · done

The form, section cards, drag handles and dialogs on the new design system, built on the split from feature 7.
**Done when:** every section and dialog uses the new components, errors still show only after touch, and the builder works fully by keyboard.
spec [0012](../specs/0012-builder-ui-refresh/index.md) · code in `src/features/builder/`

- [x] Design it (spec): `/architect builder ui refresh`
- [x] Build it: `/develop builder ui refresh`
    - [x] Page frame, toolbar and actions menu (AC-1, AC-4 to AC-10, AC-16)
    - [x] Section strip with progress (AC-11 to AC-15)
    - [x] Sections, fields and live preview on tokens (AC-17 to AC-21, AC-34 to AC-36)
    - [x] Preview CV always available, lists without a mouse (AC-22 to AC-33)
    - [x] Cleanup and guards (AC-2, AC-3, AC-37 to AC-40)

### 15. Preview & export UI refresh · in-progress

Preview page chrome (mode switch, export, back to edit) on the new design system; the resume itself stays white and print clean.
**Done when:** the toolbar uses the new components in both themes, the resume area is unchanged, and print output is unchanged.
spec [0013](../specs/0013-preview-ui-refresh/index.md) · code in `src/features/preview/`, `src/features/pdf/live-preview/`

- [x] Design it (spec): `/architect preview ui refresh`
- [ ] Build it: `/develop preview ui refresh`
    - [x] Worker drawn pages, token toolbar, download from kept bytes (AC-1, AC-3 to AC-6, AC-8, AC-9, AC-11, AC-19 to AC-21, AC-28)
    - [x] Fit search through the worker, page strip and modes (AC-12 to AC-19)
    - [x] Loading, unavailable, failure, export error and empty states (AC-10, AC-20, AC-22 to AC-25)
    - [ ] Guards, copy cleanup and checks (AC-2, AC-7, AC-26, AC-27, AC-29)

### 16. Accessibility & Lighthouse pass

A final sweep across every page against WCAG 2.2 AA and the Lighthouse targets, fixing what the refresh missed.
**Done when:** every page scores 95+ in all four Lighthouse categories and an automated axe check finds no serious issues, in EN and PL, light and dark.

- [ ] Build it: `/develop accessibility & lighthouse pass`

## Deferred

Out of scope for this pass, kept so the plan stays honest.

- **Template visual refresh**: new look for the three resume templates (web and PDF) · needs a decision
- **More templates**: a fourth template once the shared model (feature 8) makes it cheap · needs a decision
- **Smaller landing hero images**: use the card size images for the hero side cards · from spec 0011
- **One PDF viewer**: decide at the preview UI refresh whether `/preview` moves to the gallery PDF viewer · from spec 0011

## Legend

**The decision box.** Every designed feature carries exactly one sub task whose label ends with `(spec)`. Skills find it by that suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**:

| State                        | Set by                           | The feature shows                                                                                  |
| ---------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| `planned` · needs a decision | `/scope`                         | one box: `Design it (spec): /architect <feature>`                                                  |
| `in-progress` (designed)     | **`/architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /develop <feature>` + **2 to 5 milestones**            |
| `in-progress` (building)     | `/develop`                       | milestone sub boxes tick one by one; code pointer filled                                           |
| `done`                       | **you, when you decide it is**   | boxes you ran ticked; at `Prototype` the suggested point to call it done is right after `/develop` |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre workflow) and `dropped` (de scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag inherits it.
- **Workflow tier tag** beside a heading (e.g. `· Beta`) sets that one feature's rigor; no tag inherits the default.
- **Workflow** (header line), what runs after `/develop`: **Prototype** = nothing; **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`. A feature built on an unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
