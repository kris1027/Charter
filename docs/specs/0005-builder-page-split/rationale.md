# 0005. Builder page split: rationale

## Context

> ⚠️ Premise note: the scope asks for "behavior unchanged under the existing tests", but no test touches `builder-page.tsx`; the only builder test is `form-section-card.test.tsx`. A split resting on that would pass while breaking save, import or reorder. The characterization suite (AC-1) comes first so the promise means something.

`src/features/builder/builder-page.tsx` is 682 lines (the scope said 788, measured before features 3 and 6). It holds the form, fifteen add, remove and reorder functions that differ only by array key, the save logic copied three times (submit, autosave, manual), the PDF import, two alert dialogs, the toolbar and the progress card. `experience-section.tsx` (360) and `education-section.tsx` (303) are also over the 250 line target, mostly because each field repeats a 14 line label, control and error block, and all five list sections copy the same dnd-kit setup.

Sections take a hand written loose `FormApi` type through `form as unknown as FormApi`, so every value is cast (`as string`, `as ExperienceProps[]`) and a wrong field path compiles. The page calls `getInitialValues()` on every render, which reads localStorage each time; the PDF import works around it by writing storage before `form.reset`. `useForm` does not rerender the page on value changes, so the progress bar, read from `form.state.values` during render, only updates when something else rerenders the page (a save, for example).

Features 11 (responsiveness) and 14 (UI refresh) both build on this split. Breaking the saved shape is allowed this pass, but this feature does not need to.

## Options considered

### Option 1: One typed form shared with `createFormHook`, sections own their slices (chosen)

Keep a single form; build `useAppForm` and `withForm` with `createFormHook`; sections use array fields and registered field components; logic moves into hooks.

**Pros**: TanStack Form's own composition API, typed end to end; array helpers remove the page callbacks and shift field meta correctly; one submit, reset and import path stays simple.
**Cons**: new concepts and longer generic errors; more files.

### Option 2: One form per section

Each section creates its own `useForm`; the page merges values on submit, reset and import.

**Pros**: strongest isolation; a keystroke can only rerender its own section.
**Cons**: submit, progress, reset, import and autosave must gather or reset seven forms; whole resume validation (`resumeFormSchema`) splits; that solves feature 11's problem before anyone has measured it.

### Option 3: Move code only

Keep the loose `FormApi`; move callbacks into a `use-list-handlers.ts` and the dialogs into files.

**Pros**: smallest diff, lowest risk.
**Cons**: sections still do not own their state (the scope's "done when"), the casts stay, and experience stays over 250 lines.

### Option 4: Form context without `withForm`

Put the form in React context and read it with `useFormContext()` in each section.

**Pros**: no `form` prop.
**Cons**: `useFormContext` is not typed to the form's values, so the casts come back; `withForm` is the typed path the library documents.

## Rationale

The scope's "each section owns its own state slice" rules out Option 3, and keeping one resume schema plus one submit and reset path rules out Option 2, whose isolation is a performance answer for feature 11 to decide after profiling. Between the typed options, `withForm` gives sections real types where `useFormContext` does not, and `createFormHook`'s field components are what get experience and education under 250 lines without cutting behavior.

Decisions settled while writing (pick, why, runner up):

- **Initial values read once** through `useState(() => …)`, with `keepDefaultValues: true` on every `form.reset`: stops a localStorage read and JSON parse on every render. Today's code only works because it reads storage again on each render; `useForm` runs `form.update(opts)` every render, and a plain `reset(values)` replaces the stored defaults, so a fixed `initialValues` would put the old resume back on the next render (found in the cross check, confirmed in form-core `FormApi.ts` `update` and `reset`). Runner up: hold the defaults in state and set them on reset and import (more moving parts). The import still writes `resumeData` so a reload shows it, but that no longer keeps the form correct.
- **Characterization tests through a `renderWithRouter` helper** with memory history: the page needs `useNavigate`, `Link` and `useSearch`. Runner up: mock `@tanstack/react-router` (faster, but the submit navigation test would prove nothing).
- **Reorder covered by a pure id mapping test plus a browser check**: dnd-kit's keyboard sensor needs real layout, which jsdom does not have. Runner up: simulate drag in jsdom (flaky).
- **`fields/` folder** next to `toolbar/` and `form-sections/`: field components are shared by every section, so they sit beside them, not inside one.
- **`form-context.ts` separate from `resume-form.ts`**: field components need `useFieldContext` and `resume-form.ts` imports the field components; one file would make them import each other.
- **`DragHandle` sizes `sm` and `md`**: chips use a 12px grip and cards a 20px one today. Runner up: one size (a visible change).
- **`useSearch({ from: '/builder' })`, not `Route.useSearch()`**: spec 0002's lint bans `@/routes/**` imports from features, and the route file imports the page. Runner up: `getRouteApi('/builder')` (same typing, one more line).
- **Autosave, reset and submit keep today's quirks** (first tick writes once, reset keeps `saveError`, submit navigates after a failed write): this is a refactor; changing them would need their own decision.
- **Invalid `templateId` dropped with `.catch(undefined)`**: an old or typed URL still opens the builder. Runner up: redirect to `/templates` (a new flow nobody asked for).
