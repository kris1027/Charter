# Resume Builder

Free, no sign up resume builder (EN/PL). The user fills a form, picks one of three templates, and exports or imports a PDF. Client only SPA, no backend; everything lives in the browser.

## Stack

- **Language / Runtime**: TypeScript 6 (strict), React 19, Node 24 (`.nvmrc`)
- **Framework**: Vite 8 SPA, TanStack Router (file routes in `src/routes/`, `src/routeTree.gen.ts` is generated, never edit it), React Compiler via `@rolldown/plugin-babel`, set up once in `react-plugins.ts` and used by both `vite.config.ts` and `vitest.config.ts`
- **Key dependencies**: TanStack Form + Zod 4, Tailwind 4 + shadcn style Radix primitives from the unified `radix-ui` package (`src/components/ui/`), `@react-pdf/renderer` (render) + `pdfjs-dist` (parse), `@napi-rs/canvas` (dev only, rasterizes PDFs for the gallery preview script), react-i18next, motion, vite-plugin-pwa
- **Package manager**: pnpm 12 (`packageManager` in `package.json`)
- **Hosting**: Vercel (`vercel.json`: SPA rewrite plus CSP; keep it in sync with the CSP in `vite.config.ts`)

## Build approach

**Tracer Bullet**: each change lands end to end and working, so the app stays shippable after every step.

## Commands

```bash
pnpm install          # Install (copy .env.example to .env for VITE_SITE_URL)
pnpm dev              # Dev server on http://localhost:5173
pnpm build            # tsc -b plus vite build (the only typecheck)
pnpm test             # Vitest once; pnpm test:coverage enforces a 50% floor
pnpm lint             # ESLint only
pnpm format           # Prettier; CI runs format:check, templates:previews --check, lint, test, build, perf:size
pnpm perf:size        # Per route JS (brotli) against perf/budgets.json, fails a first load holding a `lazyEngines` chunk; needs a fresh dist
pnpm templates:previews  # Regenerate gallery images after a template change; --check, --baseline, --diff
pnpm perf:lighthouse  # Build, then Lighthouse CI on vite preview (local only, not in pre-commit)
pnpm pre-commit       # format, previews check, lint, test, build, perf:size (not Lighthouse); run before pushing
```

## Specs

Stored in `docs/specs/`. Format: one folder per spec, `docs/specs/NNNN-title/` with `index.md` (plus `rationale.md` and `verify.md`). Scope lives in `docs/scope/scope.md`.

## Rules

- Formatting: Prettier (`.prettierrc`): single quotes (JSX too), tabWidth 4, printWidth 100, Tailwind classes auto sorted.
- Files are `kebab-case`; import from `src` through the `@/` alias; use `import type` for types (`verbatimModuleSyntax` is on). No `any`.
- Components are arrow functions with a `ComponentNameProps` type; callbacks `on*`, handlers `handle*`.
- Validation: `src/features/resume/resume-schema.ts` is the single source of truth. Zod messages are i18n keys (`validation.*`), never raw text, and field errors show only after `isTouched`. Required: first name, last name, email (`.email()`).
- i18n: every user facing string goes through `t()`, and every new key lands in both `src/locales/en` and `src/locales/pl`. The PDF renderer cannot use `t()`; see the PDF context file.
- Templates: `developer`, `default`, `veterinary` (`src/lib/template-ids.ts`). Each is one PDF component in `src/features/templates/pdf/` (preview, detail page, export) that renders from the shared model in `src/features/templates/model/`; gallery cards show prebuilt images of those PDFs (`pnpm templates:previews`). A new resume section is a `SECTION_IDS` entry, a `ResumeView` field, a title per layout and a renderer per template; the parser reads the same titles through `printedTitle`.
- Templates are always white and never animated; dark mode and motion apply only to the surrounding UI. Language levels use the European framework: A1 to C2 plus `NATIVE`.
- GDPR clause, when enabled, renders at the bottom of every template: `cv.gdprConsent` with a company name, `cv.gdprConsentGeneric` without.
- React Compiler: compiles every component and memoizes for you, so skip new `useMemo`/`useCallback`/`memo` written only for speed. If a component misbehaves under it, opt that one out with `'use no memo'` plus a comment naming the reason; never turn the compiler off globally. The `react-hooks` lint rules (v7 `flat.recommended`) flag code it cannot compile.
- Animations: respect `prefers-reduced-motion`, parallax only on decorative layers (never text), `viewport: { once: true }` on every `whileInView` (shared variants in `src/lib/animation-variants.ts`).
- Motion loads lazily: pages render `m.*` inside `LazyMotion` (`src/app/motion-provider.tsx`, `strict`), never full `motion` components (lint enforced, spec 0008). Entrance variants carry `data-entrance` so `index.css` shows them if the engine fails or stalls.
- Storage: always go through `safeStorage` (`src/lib/storage.ts`, falls back to memory). Keys: `resumeData`, `resumeData_backup` (manual save, survives reset), `resumeData_lastSaved`, plus `theme`, `language`, `privacyNoticeAccepted`, `pwaInstallDismissed`, `builderPreviewOpen`. Breaking the saved shape is allowed this pass.
- Resume storage keys (`resumeData`, `resumeData_backup`, `resumeData_lastSaved`) are written or removed only by `saveResume`, `writeResume` and `clearResume` in `src/features/resume/stored-resume.ts`.
- Template choice travels as `?templateId=` on `/builder` and `/preview`; the gallery detail page uses the path `/templates/$templateId`.
- Route `validateSearch` ships in the bundle every page loads, so keep it zod free (plain checks such as `isTemplateId`; see `src/features/builder/builder-search.ts`).
- Builder form: one `useAppForm` from `src/features/builder/resume-form.ts` (`createFormHook`). Sections are `withForm` components, inputs are the registered field components in `src/features/builder/fields/`, and lists use `form.Field mode='array'` helpers plus `form-sections/sortable-list.tsx` (no `@dnd-kit` imports in sections, no value casts). A card list section (experience, education, languages) also renders from `form.Subscribe` on its array's `length` (passed as `count` to `SortableList`; each card reads its own fields, so typing redraws one field, spec 0009), since array fields skip `form.reset`; chip lists (skills, interests) subscribe to the whole array, since each chip shows its name and has no input. ESLint caps non test builder files at 250 lines (`max-lines`).
- Tests: co-located `*.test.ts(x)`, render via `@/test/test-utils` (real EN translations, so missing keys fail), `it('should ... when ...')`, query by role, label or text.

## Agent skills

- [tanstack-form](.agents/skills/tanstack-form/): `tanstack-skills/tanstack-skills`, TanStack Form (`createFormHook`, `withForm`, array fields)
- [tanstack-router](.agents/skills/tanstack-router/): `tanstack-skills/tanstack-skills`, file routes and search params
- [vitest](.agents/skills/vitest/): `antfu/skills`, Vitest tests and mocking
- [vite](.agents/skills/vite/): `antfu/skills`, Vite 8 config and plugins
- [react-pdf](.agents/skills/react-pdf/): `molefrog/skills`, `@react-pdf/renderer` templates
- [ask-sonner](.agents/skills/ask-sonner/): `emilkowalski/skills`, Sonner toasts

## Git

- Branch from `main` with a prefix: `feat/`, `fix/`, `chore/`, `docs/`; PR back into `main`.
- Commits: Conventional Commits style (`fix(pdf): ...`).

## Issues and domain docs

- Issues: GitHub Issues via `gh`, see `docs/agents/issue-tracker.md`; labels in `docs/agents/triage-labels.md`.
- Domain: `CONTEXT.md` plus `docs/adr/` at the root when they exist, see `docs/agents/domain.md`.

## Context files

- [src/features/templates/pdf/AGENTS.md](src/features/templates/pdf/AGENTS.md) (PDF render, export, preview fitting and import round trip; `src/features/pdf/AGENTS.md` points to it)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
