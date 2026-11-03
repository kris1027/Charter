# 0005. Builder page split: one typed form, sections that own their lists, extracted save, import and toolbar

**Date**: 2026-11-03
**Status**: In Progress

## Summary

The builder page is one 682 line file that holds the form, fifteen copies of the same list logic, three copies of the save logic, two dialogs and the toolbar. This spec splits it into small files around one typed form (TanStack Form's `createFormHook`, its built in way to share a form across components), where each section adds, removes and reorders its own list and the drag and drop setup lives in one shared component. Save, autosave, PDF import, progress and the toolbar each move into their own file. A test suite written first, against today's code, proves nothing changes; two small fixes ride along (the progress bar updates live, and `?templateId=` is validated), and nothing on screen looks different.

## Requirements

**User stories**:

- As a job seeker, I want the builder to behave exactly as it does today after the refactor, so that nothing I rely on (saving, import, reordering) breaks.
- As a job seeker, I want the progress bar to follow my typing, so that I know when Preview unlocks.
- As the developer of features 11 and 14, I want each section, field and toolbar piece in its own small typed file, so that I can make the builder faster and restyle it one piece at a time.

**Acceptance criteria**:

- **AC-1**: `src/features/builder/builder-page.test.tsx` lands in the first commit, written against today's code, and its cases pass unchanged after every later commit (later steps only add cases, for AC-9 and AC-10). It covers: stored `resumeData` loads on mount; `?templateId=` wins over the stored template; adding an experience puts it first, adding education or a language puts it last, a skill and an interest are added by typing and pressing Enter (blank input adds nothing, the input clears after adding); removing an item removes exactly that item; manual save writes `resumeData`, `resumeData_backup` and `resumeData_lastSaved` and shows the saved time; with fake timers, after an edit the next 30 second tick writes and shows the autosaved text, and a second tick with no new edit writes nothing; reset (confirmed in its dialog) removes `resumeData` and `resumeData_lastSaved`, keeps `resumeData_backup` and empties the form, and the form stays empty after a further rerender (type into a field, then check the other fields); a PDF over 10MB shows the too large text in the error dialog; a successful import (with `loadResumeFromPDF` mocked) fills the form and writes `resumeData`, and the imported values survive a further rerender; a failed import shows the error message; Preview is disabled at 0% and unlocks after first name, last name and then email are typed (email last, because the old page only rerenders that button when validity flips); a valid submit writes `resumeData` and navigates to `/preview?templateId=<id>`; a failed storage write shows the save failed text.

    Test setup: a minimal inline route tree (`/builder` with the page, `/preview` as a stub) built in `src/test/`, never imported from `src/routes/`; the real `safeStorage` over jsdom `localStorage`, cleared before each case; `vi.mock('@/features/pdf/pdf-parser')` for `loadResumeFromPDF`; assertions on English text from the real translations; `vi.useFakeTimers()` with `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`; the saved time matched by a regex, not an exact string; `waitFor` before asserting errors or Preview state, since some array helpers validate asynchronously.

- **AC-2**: No non test file under `src/features/builder/` is over 250 lines (blank lines and comments not counted). ESLint enforces it with `max-lines: ['error', { max: 250, skipBlankLines: true, skipComments: true }]` in its own block on `src/features/builder/**/*.{ts,tsx}` with `ignores: ['**/*.test.{ts,tsx}']`, placed after the `no-restricted-imports` blocks (a different rule, so it overrides nothing); `eslint.config.test.ts` gains a case proving a 251 line builder file fails.
- **AC-3**: The form is created once with `useAppForm` from `src/features/builder/resume-form.ts` (built by `createFormHook`), and every section is a `withForm` component typed by `ResumeFormValues`. `form-component-types.ts` is deleted. No file in `src/features/builder/` contains `as unknown as`, and no field value is cast (`as string`, `as boolean`, `as ExperienceProps[]` and similar). `pnpm build` typechecks it.
- **AC-4**: Each list section (experience, education, skills, languages, interests) owns its list through `form.Field` with `mode='array'` and the built in `insertValue`, `pushValue`, `removeValue` and `moveValue`. `BuilderPage` passes each section only `form`, and holds no add, remove or reorder function. New items keep today's empty shapes and positions (experience first, all others last).
- **AC-5**: Drag and drop lives in `form-sections/sortable-list.tsx` (sensors, `DndContext`, `SortableContext`, id to index mapping, `onMove`) and `form-sections/sortable-item.tsx` (`useSortableItem` plus `DragHandle`). No section imports from `@dnd-kit/*` directly. Behavior matches today: ids `${prefix}-${index}` (index typed `number`, so template literal field paths typecheck), pointer drag starts after 8px, keyboard sorting works, vertical strategy for experience, education and languages, horizontal for skills and interests, and the dragged item gets today's ring and shadow classes.
- **AC-6**: `resume-form.ts` registers field components (`TextField`, `TextareaField`, `BulletTextareaField`, `DateField`, `CheckboxField`, `SelectField`) in `src/features/builder/fields/`. Each renders the label, the control with `id` and `name` set to the field path, and `FieldError` shown only after `isTouched`, with today's classes (including the required star and red border on invalid touched inputs). Each component reads its value through `useFieldContext<T>()` with the one value type it supports (that generic is the single unchecked spot, by design). `SelectField` takes its options as a prop; the languages section passes `getLanguageLevels(t)` from `src/features/resume/language-levels.ts` as today. `LANGUAGE_LEVELS` moves from `resume-schema.ts` into that file (exported), and both the schema and `getLanguageLevels` read it, so the list exists once. `DateField` keeps today's value format (an ISO string, `''` when cleared). `BulletTextareaField` keeps today's bullet rules exactly: a first typed character gets `• ` before it, pasting into an empty field adds `• ` unless the text already starts with one, and Enter inserts `\n• ` with the caret placed after it.
- **AC-7**: `saveResume(values, { backup })` and `clearResume()` in `src/features/resume/stored-resume.ts` are the only code that writes or removes `resumeData`, `resumeData_backup` and `resumeData_lastSaved`. `use-resume-autosave.ts` owns the 30 second interval, the last saved JSON, `lastSaved`, `isAutoSaved`, `saveError` and `isSaving` (manual save holds `isSaving` for 500ms, as today). The last saved JSON starts as `''`, as today, so the first tick after mount writes once even with no edit. Submit saves without backup and navigates whatever `ok` is, and does not touch `isSaving` (today it flips it within one render). Reset calls `clear()`, which only removes the storage keys and sets `lastSaved` to null (the last saved JSON, `saveError` and `isAutoSaved` stay, as today), then `form.reset(emptyValues, { keepDefaultValues: true })` with empty values plus the active template id.
- **AC-8**: `use-pdf-import.ts` owns the hidden file input ref, the 10MB limit, loading and error state. It normalizes the import, falls back to the active template id, writes `resumeData` (as today, so a reload shows the import), then calls `form.reset(newValues, { keepDefaultValues: true })`, shows errors in `toolbar/pdf-error-dialog.tsx`, and always clears the input so the same file can be picked again.
- **AC-9**: Progress comes from a pure `calculateProgress(values)` in `src/features/builder/calculate-progress.ts` with today's weights (first name, last name, email 10 each; experience 25; education 20; skills 15; languages 5; interests 5; capped at 100). `form-progress.tsx` and the submit button read it through a form subscription, so the bar, the percentage, the complete text and the under 30% Preview lock all update as the user types.
- **AC-10**: `src/routes/builder.tsx` validates search with `z.object({ templateId: z.enum(TEMPLATE_IDS).optional().catch(undefined) })`. `BuilderPage` takes no props and reads `useSearch({ from: '/builder' })` without a cast (features may not import `@/routes/**`, spec 0002). `activeTemplateId` is a `TemplateId` (`search.templateId ?? 'developer'`). An unknown `templateId` is dropped, so the form falls back to the stored template when it is a valid `TemplateId`, then `developer`. The toolbar shows the URL template name, or `developer` when the URL has none, as today. The effect that copies a changed `search.templateId` into the form's `templateId` while the page is open stays.
- **AC-11**: Apart from the two intended changes (live progress in AC-9, and an unknown `templateId` dropped in AC-10, where today the raw id shows in the badge and lands in the form), the builder looks and behaves the same: same Tailwind classes, toolbar order, motion wrappers (`fadeInUp` delays), dialogs and i18n keys, with no new translation keys. `pnpm pre-commit` passes, and `/builder` stays within its 270 KB `perf:size` budget.

## Decision

**Chosen option**: Option 1: One typed form shared with `createFormHook`, sections that own their slices, and logic extracted into hooks.

`BuilderPage` keeps one TanStack Form instance; sections receive it through `withForm`, own their arrays through the field array helpers, render fields through registered field components, and drag through one shared sortable list. Save, autosave, PDF import, progress and the toolbar each get their own file.

**Implementation skills**: `tanstack-form` (`.claude/skills/tanstack-form/`) for `createFormHook`, `withForm`, array fields and `Subscribe` · `tanstack-router` (`.claude/skills/tanstack-router/`) for `validateSearch` and `Route.useSearch` · `vitest` (`.claude/skills/vitest/`) for fake timers and module mocks in the characterization suite.

## Feature design

**Target files** (lines are rough estimates; the lint rule is the real check):

| File                                                                                  | Holds                                                                                                        | ~Lines         |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------- |
| `builder-page.tsx`                                                                    | `useAppForm`, initial values, submit, layout, motion wrappers, sections in order                             | 150            |
| `resume-form.ts`                                                                      | `createFormHook` with field components, `useAppForm`, `withForm`, `resumeFormOptions`                        | 40             |
| `form-context.ts`                                                                     | `createFormHookContexts()` (separate file so field components and `resume-form.ts` do not import each other) | 10             |
| `use-resume-autosave.ts`                                                              | interval, last saved JSON ref, save state, `save`, `clear`                                                   | 70             |
| `use-pdf-import.ts`                                                                   | file ref, size limit, import, loading and error state                                                        | 70             |
| `calculate-progress.ts`                                                               | pure progress function                                                                                       | 30             |
| `form-progress.tsx`                                                                   | progress card                                                                                                | 50             |
| `toolbar/builder-toolbar.tsx`                                                         | back link, title, import, save, reset, status, template badge, toggles                                       | 110            |
| `toolbar/reset-dialog.tsx`, `toolbar/pdf-error-dialog.tsx`, `toolbar/save-status.tsx` | the two dialogs and the saved/failed status                                                                  | 40 to 60 each  |
| `fields/*.tsx`                                                                        | `TextField`, `TextareaField`, `BulletTextareaField`, `DateField`, `CheckboxField`, `SelectField`             | 30 to 80 each  |
| `form-sections/sortable-list.tsx`, `form-sections/sortable-item.tsx`                  | shared drag and drop                                                                                         | 60, 40         |
| `form-sections/*-section.tsx`                                                         | one section each, card or chip markup kept in the section                                                    | under 200 each |

**Interfaces**:

- `EMPTY_RESUME: ResumeFormValues` (typed, no cast, `templateId: 'developer'`) lives in `stored-resume.ts`. `resumeFormOptions = formOptions({ defaultValues: EMPTY_RESUME, validators: { onChange: resumeFormSchema } })`. `withForm` sections spread it; the page passes real `defaultValues` and `onSubmit`.
- Initial values: `const [initialValues] = useState(() => …)` (read once). Every `form.reset` passes `{ keepDefaultValues: true }`: `useAppForm` calls `form.update(opts)` each render, and a plain `reset(values)` replaces the stored defaults, so the next render would see `initialValues` as changed and put the old resume back.
- Field components use `useFieldContext<string>()` (or `boolean` for the checkbox); `withForm` keeps the `fieldComponents` generics so `form.AppField` exposes them typed.
- Sections: `withForm({ ...resumeFormOptions, render: ({ form }) => … })`, used as `<ExperienceSection form={form} />`.
- `SortableList<T>({ items: T[], idPrefix: string, strategy: 'vertical' | 'horizontal', onMove: (from: number, to: number) => void, children: (item: T, index: number, id: string) => ReactNode })`. Sections pass `field.moveValue` as `onMove`.
- `useSortableItem(id)` returns `{ setNodeRef, style, isDragging, handleProps }`; `DragHandle` takes `handleProps` and a `size` of `'sm' | 'md'` to match today's chip and card icons.
- `saveResume(values: ResumeFormValues, options?: { backup?: boolean }): { ok: boolean; json: string; savedAt: Date }` writes `resumeData`, then `resumeData_backup` when asked, then `resumeData_lastSaved`. `ok` reflects the `resumeData` write, as today. `clearResume()` removes `resumeData` and `resumeData_lastSaved`.
- `useResumeAutosave(form)` returns `{ lastSaved, isAutoSaved, saveError, isSaving, save(options), clear() }`. `save` is used by the manual save (`{ backup: true }`, autosaved false) and by submit; the interval calls it internally with autosaved true. All paths update the last saved JSON ref.
- `usePdfImport({ form, activeTemplateId })` returns `{ fileInputRef, isLoading, error, clearError, handleFileChange }`.
- `EMPTY_EXPERIENCE`, `EMPTY_EDUCATION` and `EMPTY_LANGUAGE` (`proficiency: 'A1'`) join `EMPTY_PERSONAL_INFO` in `stored-resume.ts`. Sections always add a fresh copy (`{ ...EMPTY_EXPERIENCE }`), never the constant itself.
- Skill and interest add: no op when `input.trim()` is empty; otherwise `field.pushValue({ name: input.trim() })` and the local input clears. Enter in the input adds, with `preventDefault` so the form does not submit.
- Progress subscriptions select a number: `form.Subscribe selector={(s) => calculateProgress(s.values)}`, so the card rerenders only when the percent changes. The submit row selects `[s.canSubmit, s.isSubmitting, s.isValid, calculateProgress(s.values)]`.

**Value sourcing**:

| Action                 | Value produced / displayed                         | Source                                                                                                                                                                       |
| ---------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mount                  | initial form values                                | `loadStoredResume()` read once through `useState(() => …)`, else `EMPTY_RESUME`; `templateId` = `search.templateId` ?? stored (only when in `TEMPLATE_IDS`) ?? `'developer'` |
| Mount                  | active template id (badge, reset, import fallback) | `search.templateId` from `validateSearch` ?? `'developer'`, typed `TemplateId` from `@/lib/template-ids`                                                                     |
| Open page, URL changes | form `templateId`                                  | the kept `useEffect` on `search.templateId`                                                                                                                                  |
| Toolbar                | template name                                      | `t(\`templates.${activeTemplateId}.name\`)`                                                                                                                                  |
| Add item               | the new item                                       | `EMPTY_*` constants; skill and interest `{ name: input.trim() }` from the section's local input state                                                                        |
| Reorder                | from and to index                                  | `SortableList` maps `active.id` and `over.id` back to indexes                                                                                                                |
| Autosave               | whether to write                                   | `JSON.stringify(form.state.values)` vs the hook's last saved JSON ref                                                                                                        |
| Save status            | time shown                                         | `savedAt` from `saveResume`, shown with `toLocaleTimeString()`                                                                                                               |
| Save status            | failed flag                                        | `ok` from `saveResume`                                                                                                                                                       |
| Progress, Preview lock | percent                                            | `calculateProgress(state.values)` through `form.Subscribe`                                                                                                                   |
| Preview lock           | can submit                                         | `state.canSubmit` and `percent >= 30`                                                                                                                                        |
| Import                 | new values                                         | `normalizeResume(parsed)` plus `parsed.templateId ?? activeTemplateId`                                                                                                       |
| Import error           | message                                            | `error.message`, else `t('dialogs.pdfError.unexpected')`; over 10MB `t('builder.pdfTooLarge')`                                                                               |

**Key invariants**:

- One form instance per page; sections never call `useForm` or `useAppForm`.
- Initial values are computed once per mount. `form.reset` is the only way the page replaces all values (reset and import).
- Storage keys are written only in `stored-resume.ts`, always through `safeStorage`.
- Templates, the PDF renderer, the parser and the schema are untouched; the saved shape does not change.

**Security model**: no change. Everything stays in the browser; the PDF file is read locally and the 10MB limit stays.

**Configuration required**: none.

**Critical test scenarios**:

- Happy path: fill the required fields, add one experience, see progress pass 30% live, submit, land on `/preview?templateId=developer` with `resumeData` written, verifies **AC-1**, **AC-9**.
- Lists: add, remove and move items in each list section through the array helpers; `SortableList` maps ids to indexes in a unit test, verifies **AC-4**, **AC-5**.
- Fields: a touched invalid email shows its error, an untouched one does not; the bullet textarea's typing, paste and Enter rules each in a unit test, verifies **AC-6**.
- Storage: `saveResume` with and without backup, a failing `safeStorage` write returns `ok: false`, `clearResume` leaves the backup, verifies **AC-7**.
- Import failure: oversized file and a rejected parse each show the dialog and clear the input, verifies **AC-8**.
- Search: `/builder?templateId=nope` loads the stored template and shows the developer badge, verifies **AC-10**.

## Build plan

One PR on `feat/builder-page-split`, one commit per step, `pnpm pre-commit` green after each (Tracer Bullet: the page stays shippable at every commit).

1. Add a `renderWithRouter` helper to `@/test/test-utils` (memory history and the minimal inline route tree from AC-1, with `/builder` and a `/preview` stub) and write `builder-page.test.tsx` against today's code, satisfies **AC-1**.
2. Add `saveResume`, `clearResume` and the `EMPTY_*` constants with tests; switch the page's three save paths and reset to them, satisfies **AC-7**.
3. Add `form-context.ts`, the six field components with tests, and `resume-form.ts`; switch the page to `useAppForm` with initial values read once and `keepDefaultValues: true` on both resets in the same commit (the rerender cases from step 1 catch a miss); export `LANGUAGE_LEVELS`; run `pnpm build && pnpm perf:size` to check `/builder` still fits, satisfies **AC-3**, **AC-6**, **AC-11**.
4. Add `sortable-list.tsx` and `sortable-item.tsx` with an id mapping test, satisfies **AC-5**.
5. Move each section onto `withForm`, field components, array helpers and `SortableList`, one commit per section: personal info, GDPR, experience (with `BulletTextareaField`), education, languages, skills, interests. Remove that section's page callbacks in the same commit; delete `form-component-types.ts` with the last one, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-6**.
6. Extract `use-resume-autosave.ts`, satisfies **AC-7**.
7. Extract `use-pdf-import.ts` and `toolbar/pdf-error-dialog.tsx`, satisfies **AC-8**.
8. Add `calculate-progress.ts` with tests, `form-progress.tsx`, and move the submit row onto the same subscription, satisfies **AC-9**.
9. Extract `toolbar/builder-toolbar.tsx`, `toolbar/reset-dialog.tsx` and `toolbar/save-status.tsx`; the template name comes from the i18n key, satisfies **AC-10**, **AC-11**.
10. Add `validateSearch` to `src/routes/builder.tsx`, drop the `templateId` prop and the search cast, add the unknown id test, satisfies **AC-10**.
11. Add the `max-lines` override to `eslint.config.js` and its case to `eslint.config.test.ts`, satisfies **AC-2**.
12. Run `pnpm pre-commit` and the browser pass in [verify.md](verify.md), satisfies **AC-11**.

## Consequences

**Positive**:

- Each section, field and toolbar piece can change on its own; features 11 and 14 build on these seams instead of the 682 line file.
- Real types catch wrong field paths at build time, and the cast layer is gone.
- `removeValue` and `moveValue` shift field meta (touched, errors) with the item; today's `setFieldValue` left meta on the old index.
- The builder gets its first real test suite.

**Negative / tradeoffs**:

- About 25 files instead of 9; finding code means knowing the folder layout.
- `createFormHook` and `withForm` are new concepts here, and their generic types make error messages longer.
- Two intended behavior changes ride in a refactor (live progress, dropped unknown `templateId`); each has its own test and is called out in the PR.
- The `max-lines` rule can push a future change to split a file sooner than it would like.

**Neutral**:

- No saved shape change, so no storage migration. Reverting the PR restores the old page.
- Classes stay raw palette colors; the builder joins the token only lint list in feature 14, not here.

## Follow-up

- [ ] Stable item ids instead of index ids for sortable lists (better drag animation and React keys); fits feature 14, touches the schema and the PDF import.
- [ ] The template badge shows `developer` when the URL has no `templateId` even if the stored resume uses another template; fix in feature 14.
- [ ] The installed `tanstack-form`, `tanstack-router` and `vitest` skills are not yet listed in root `AGENTS.md`; they are project wide and belong in its `## Rules` or an `## Agent skills` list.
- [ ] Feature 11 (builder responsiveness) should profile against this split: field level subscriptions now make it cheap to stop the page rerendering.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
