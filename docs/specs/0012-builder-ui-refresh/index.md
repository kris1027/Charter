# 0012. Builder UI refresh: solid tokens, a section strip with progress, and a form that works without a mouse

**Date**: 2026-11-09
**Status**: Accepted

## Summary

This spec moves the builder page onto the app's design tokens, in the same calm style as the gallery (no gradients, glass blur or moving background). The long form stays one page, and a new strip of section links shows where you are and how much is filled in. The crowded toolbar becomes a few main controls plus a menu that fits a phone. Preview CV is now always clickable and takes you to the first problem, and every list can be used fully by keyboard and without dragging. The saved resume shape, the validation rules and the PDFs do not change.

## Requirements

**User stories**:

- As a job seeker with a long resume, I want to jump between sections and see what is done, so that I do not scroll back and forth hunting for things.
- As a phone user, I want a toolbar that fits and leaves room for typing, so that the page never scrolls sideways.
- As someone whose form is not ready, I want Preview CV to tell me what is wrong, so that I am not stuck behind a grey button.
- As a keyboard or screen reader user, I want adding, removing and reordering to keep my place and tell me what happened, so that I can finish a resume without a mouse.
- As a person who cannot drag, I want buttons to reorder my list items, so that order is not reserved for mouse users.

**Acceptance criteria**:

_Page shell_

- **AC-1**: The `/builder` root is `bg-background min-h-screen` with `data-builder-page` and no `overflow` class on it or on any ancestor it adds, so `sticky` works. `ParallaxBackground`, every `backdrop-blur`, every `bg-gradient-*` and `text-gradient-*`, and every `m.*` entrance are gone from the page.
- **AC-2**: `src/features/builder/**/*.{ts,tsx}` is in `TOKEN_ONLY_FILES` and imports nothing from `motion/react`. `pnpm lint` passes.
- **AC-3**: `src/components/parallax-background.tsx` and `src/components/geometric-shapes.tsx` are deleted, along with any keyframes and classes only they used, and `DESIGN.md` no longer lists them.

_Toolbar_

- **AC-4**: The toolbar is `sticky top-0 z-10`, 56px high (`h-14`), solid `bg-background` with a bottom border. Left to right it holds the template link, the `h1`, then, pushed right: save status, the preview toggle (from `xl` only, as today), Preview CV, the actions menu, `LanguageToggle`, `ThemeToggle`.
- **AC-5**: The template link replaces both the back link and the badge. It goes to `/templates`, shows an arrow plus `templates.<id>.name` from `sm` up and only the arrow below that, and its accessible name is `builder.changeTemplate` with the template name.
- **AC-6**: The page has exactly one `h1` (`builder.title`), in the toolbar, visible from `md` up and `sr-only` below that. It uses `font-display` and no gradient.
- **AC-7**: The actions menu is a `DropdownMenu` with `modal={false}` behind an icon button named `builder.actions.label`. Its items, in order: Load PDF, Save, a separator, Reset. Load PDF is disabled during an import and Save during a save, as the buttons are today. The hidden file input stays mounted outside the menu.
- **AC-8**: Reset opens the existing confirm dialog, now controlled and rendered outside the menu content. Focus moves into the dialog when it opens, and to the actions menu trigger when it closes, by either button or Escape. The menu's `onCloseAutoFocus` calls `preventDefault` when Reset was chosen, so the menu and the dialog never compete for focus.
- **AC-9**: During an import the save status spot shows a spinner and `builder.loading` (spinner only below `sm`), inside an always mounted `role='status'` element so the change is announced. Import beats save error, and save error beats the last saved time. Autosave text stays out of the live region, so autosave never interrupts. A manual Save puts `builder.saved` in that same `role='status'` element once, so it is announced. Below `sm`, where only the icon shows, the text is `sr-only` rather than `hidden`.
- **AC-10**: At 320px wide the page has no sideways scroll, in EN and PL.

_Section strip and progress_

- **AC-11**: Below the toolbar, a `nav` named `builder.sectionNav.label` holds one link per section in form order (personal, experience, education, skills, languages, interests, GDPR), then the percent and a slim bar. The strip is 44px high (`h-11`), solid `bg-background` with a bottom border. It is `md:sticky md:top-14 md:z-10`, and on phones it scrolls away with the page. The links sit in a `min-w-0 flex-1 overflow-x-auto` list that scrolls sideways when they do not fit, with the percent and bar `shrink-0` beside it, so the percent stays in view at 320px.
- **AC-12**: `FormProgress` is gone. The percent is `calculateProgress` with its numbers unchanged, exposed through `role='progressbar'` on the wrapper around the percent and bar, which renders at every width, with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and the name `builder.progress.title`. The bar inside it is `bg-primary` on `bg-muted`, hidden below `sm`; the percent text always shows.
- **AC-13**: A section link shows a check icon (`text-success`, with `sr-only` `builder.sectionNav.completed`) under exactly these rules: personal info when first name, last name and email are all filled; experience, education, skills, languages and interests when they hold at least one item; GDPR never. Filled means what the percent already means: any non empty string, untrimmed and not checked for validity. An item is any entry in the list, so pressing Add on a card counts even while the card is blank. The check and the percent read the same logic, so they cannot disagree.
- **AC-14**: Activating a link scrolls to that section, moves focus to its `h2`, and does not change the URL. The click handler calls `scrollIntoView` on the section, then `focus({ preventScroll: true })` on the `h2`, so focus does not cancel the scroll. The scroll is smooth unless `window.matchMedia('(prefers-reduced-motion: reduce)')` matches, then instant. The section lands fully clear of the sticky bars.
- **AC-15**: The active section's link gets `aria-current='location'` and `bg-accent`, updated on scroll. Active is the last section whose top has reached the page's `scroll-padding-top`; the first section before any has; the last section when the page is scrolled to the bottom. Activating a link makes that section active at once and holds it until no scroll event has fired for 150ms, so short sections near the end still show as active on arrival. When the active link is outside the strip's visible area, only the strip scrolls, through `scrollTo` on the list element, and the page itself does not move.
- **AC-16**: Tabbing to a field near an edge scrolls it clear of the sticky bars and the floating Preview button, using `scroll-padding` on the page.

_Sections and fields_

- **AC-17**: Every section is a `section` labelled by its `h2`, on `bg-card`, `border`, `rounded-xl`, `shadow-surface`, with no hover effect. Every section header has the same icon chip (`bg-accent text-primary`). `iconGradient` no longer exists on any component. Item titles are `h3`, so heading levels do not skip.
- **AC-18**: List items sit on `bg-background` with a `border` and no shadow. While dragging, an item shows `shadow-overlay` and `ring-2 ring-ring`. `ListEmptyState` uses `bg-muted text-muted-foreground` for its icon.
- **AC-19**: Add buttons use `variant='outline'`. Only Preview CV uses the default variant. Required marks and field error borders use `destructive`, and no field passes its own error color class.
- **AC-20**: Every field that can fail validation (`TextField`, `TextareaField`, `BulletTextareaField`, GDPR company name) sets `aria-invalid` when `isTouched && !isValid` and points `aria-describedby` at its error text. GDPR company name also shows a `FieldError`. Date, select and checkbox fields cannot fail under the current schema, so they need neither. Errors still show only after touch.
- **AC-21**: The skill and interest inputs have `maxLength={100}`, matching the schema, and use `onKeyDown` in place of the deprecated `onKeyPress`. Enter calls `preventDefault`, so it never submits the form, and is ignored while `event.nativeEvent.isComposing` is true.

_Preview CV_

- **AC-22**: Preview CV appears in the toolbar and at the end of the form, through one shared component. Neither button is ever disabled by validation or progress. While submitting, it keeps its label, so the toolbar does not shift, and sets `aria-busy`. `OpenPreviewButton` drops its gate the same way. `canOpenPreview` and `PREVIEW_UNLOCK_PROGRESS` are deleted.
- **AC-23**: Activating Preview CV on an invalid form marks all fields touched, shows their errors, and moves focus to the first field in page order with `aria-invalid`. This also works on the second and later attempts, and on a fresh form nobody has typed in. A valid form saves and goes to `/preview` as today.
- **AC-24**: When the failed attempt came from `OpenPreviewButton` inside the phone sheet, the sheet closes and focus lands on the invalid field, not on the sheet's trigger.
- **AC-25**: When the form is invalid but no field has `aria-invalid` (for example a bad value inside an imported chip), a destructive toast with id `builder-invalid` shows `builder.validation.fixErrorsUnknown`.
- **AC-26**: The existing `builder.validation.fixErrors` text stays beside the bottom button, in `text-destructive`.

_Lists_

- **AC-27**: Adding a card moves focus to its first field: `experiences[0].company`, or the new last `education[n].institution` or `languages[n].language`. Adding a chip keeps focus in its input and announces `builder.reorder.added` with the chip's name.
- **AC-28**: Removing a card moves focus to that section's Add button. Removing a chip moves focus to that section's input. Every removal announces `builder.reorder.removed` with the item's title or name, including removing the last item in a list.
- **AC-29**: Each card has Move up and Move down buttons beside its remove button, named with the item (`accessibility.moveUp`, `accessibility.moveDown`). Move up is disabled on the first item and Move down on the last.
- **AC-30**: Each chip shows drag handle, name, and a menu button named with the chip (`accessibility.itemActions`). The menu is a `DropdownMenu` with `modal={false}` and holds Move left, Move right and Remove, with moves disabled at the ends. The old hover only remove button is gone, so every action is reachable by touch and keyboard.
- **AC-31**: After any move by button or menu, focus follows the moved item to the same control at its new position. If that control is now disabled, focus goes to the opposite move button on a card, or the menu trigger on a chip. A polite live region announces `builder.reorder.moved` with the new position and total.
- **AC-32**: Drag handles, move buttons, remove buttons and chip menu buttons are each at least 24 by 24 CSS pixels.
- **AC-33**: Keyboard dragging (Space, arrows, Space) still works, and its instructions and announcements come from translation keys, in both languages.

_Live preview and dialogs_

- **AC-34**: The live preview panel, sheet, body and page list use tokens only: panel `bg-card border shadow-surface`, canvas `bg-paper shadow-surface ring-1 ring-border`. The panel sticks clear of both bars (`top-[7.25rem]`, `h-[calc(100vh-8.25rem)]`). `[contain:strict]` stays.
- **AC-35**: The floating Preview button below `xl` is `variant='secondary'` with `rounded-full` and `shadow-overlay`. The page has enough bottom padding below `xl` that it never covers the bottom Preview CV button.
- **AC-36**: The reset and PDF error dialogs use tokens only. Their copy and behavior do not change.

_Guards_

- **AC-37**: All new strings exist in EN and PL, and keys no longer used are deleted from both.
- **AC-38**: `form-sections` stay free of `@dnd-kit` imports and no non test builder file passes 250 lines. A keystroke in one card still redraws no other card or section, and `builder-render-counts.test.tsx` passes.
- **AC-39**: Autosave, manual save, reset, PDF import, `?templateId=` and the saved resume shape behave as on `main`, under the existing tests (updated only to open the menu and to expect two Preview CV buttons).
- **AC-40**: `pnpm pre-commit` passes with `/builder` inside its current budget. No budget is raised. `pnpm perf:lighthouse` meets its current floors, and the layout shift score on `/builder` is under 0.01.

## Decision

**Chosen option**: Option 1: Refresh in place, with a section strip

Keep the single long form and its logic, restyle every builder component on the spec 0004 tokens, add one section strip that also carries progress, and fix keyboard and non drag use in the same pass.

**Implementation skills**: `tanstack-form` (`tanstack-skills/tanstack-skills`, `.agents/skills/tanstack-form/`) · `ask-sonner` (`emilkowalski/skills`, `.agents/skills/ask-sonner/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

## Feature design

**Design source**: the current app UI. `DESIGN.md` plus the gallery from spec 0011. No design tool or new token is involved.

**Data model**: none. No stored shape, schema rule or storage key changes.

### Components

| File                                                       | Change  | Contract                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/features/builder/builder-sections.ts`                 | new     | `BUILDER_SECTION_IDS`: `personalInfo`, `experiences`, `education`, `skills`, `languages`, `interests`, `gdprConsent` (the form value keys). `sectionAnchor(id)` returns `section-${id}`.                                                                                       |
| `src/features/builder/calculate-progress.ts`               | change  | adds `isSectionComplete(id, values)`; `calculateProgress` reuses it for the lists. Percent results do not change. The gate exports are deleted.                                                                                                                                |
| `src/features/builder/section-nav.tsx`                     | new     | `withForm`. Each link has its own `form.Subscribe` selecting one boolean; the percent selects one number.                                                                                                                                                                      |
| `src/features/builder/use-active-section.ts`               | new     | a passive scroll listener limited to one run per animation frame, comparing each section's `getBoundingClientRect().top` with the computed `scroll-padding-top` of `html` (AC-15). Returns `{ activeId, activate }`. State lives in `SectionNav`, so the form does not redraw. |
| `src/features/builder/preview-cv-button.tsx`               | new     | `withForm`, prop `size: 'sm' \| 'lg'`, calls `form.handleSubmit`, subscribes only to `isSubmitting` for `aria-busy`.                                                                                                                                                           |
| `src/features/builder/focus-first-invalid.ts`              | new     | `focusFirstInvalid(): boolean`, focuses `[data-builder-page] [aria-invalid='true']` and reports whether it found one. Callers decide the timing (see _Invalid submit wiring_).                                                                                                 |
| `src/features/builder/form-sections/focus-field.ts`        | new     | `focusField(id)`, focuses an element by id after one animation frame, because field ids are index based and the new item renders on the next pass.                                                                                                                             |
| `src/features/builder/toolbar/builder-actions-menu.tsx`    | new     | the menu, the reset dialog state and the focus return (AC-7, AC-8).                                                                                                                                                                                                            |
| `src/features/builder/toolbar/builder-toolbar.tsx`         | rewrite | takes `previewButton: ReactNode`, the same slot pattern as `unavailableAction`, so the toolbar never needs the form type.                                                                                                                                                      |
| `src/features/builder/toolbar/save-status.tsx`             | change  | adds `isImporting` (AC-9).                                                                                                                                                                                                                                                     |
| `src/features/builder/toolbar/reset-dialog.tsx`            | change  | `{ open, onOpenChange, onConfirm, onCloseAutoFocus }`, no trigger.                                                                                                                                                                                                             |
| `src/features/builder/form-sections/form-section-card.tsx` | rewrite | props `sectionId`, `icon`, `title`, `description`, `headerAction`, `children`. The `h2` has `tabIndex={-1}`.                                                                                                                                                                   |
| `src/features/builder/form-sections/sortable-list.tsx`     | change  | children become `(index, id, controls: ItemMoveControls)`, with `{ canMoveUp, canMoveDown, moveUp, moveDown }`. Owns the translated `accessibility` prop of `DndContext`, and reports moves through an `onAnnounce` prop.                                                      |
| `src/features/builder/form-sections/use-list-announcer.ts` | new     | `{ message, announce }`. Each list section calls it and renders `message` in an always mounted `sr-only` `role='status'` element, because `SortableList` unmounts when a list becomes empty.                                                                                   |
| `src/features/builder/form-sections/sortable-item.tsx`     | rewrite | `SortableCard` and `SortableChip` take `controls`. `SortableChip` owns its menu.                                                                                                                                                                                               |
| `src/components/ui/field-error.tsx`                        | change  | optional `id` prop.                                                                                                                                                                                                                                                            |
| `src/features/builder/fields/field-a11y.ts`                | new     | `fieldA11y(name, meta, describedBy?)` returns `{ errorId, ariaProps }`: `aria-invalid` and `aria-describedby` only after touch (AC-20). Fields and the GDPR company name take the error id from it.                                                                            |
| `src/features/builder/use-reveal-focused-field.ts`         | new     | a `focusin` listener on the page's form that calls `scrollIntoView({ block: 'nearest' })` on a focused control. Browsers skip a tall field that is partly visible, which `scroll-padding` alone leaves under the floating Preview button (AC-16).                              |
| `src/features/builder/use-menu-action-focus.ts`            | new     | `{ placesFocus, onCloseAutoFocus }` for a menu item whose action places focus itself, used by the chip menu and the actions menu (AC-8, AC-31).                                                                                                                                |
| `src/features/builder/form-sections/card-list-section.tsx` | new     | the frame of experience, education and languages: Add, the empty state or `SortableList`, remove focus and the live region. The section keeps `form.Field mode='array'` and the `form.Subscribe` on `length`, and renders each card.                                           |
| `src/features/builder/form-sections/chip-list-section.tsx` | new     | the frame of skills and interests: the name input and Add, the empty state or chips, and the live region. The section keeps the field and the `form.Subscribe` on the whole array.                                                                                             |
| `src/features/builder/form-progress.tsx`                   | delete  |                                                                                                                                                                                                                                                                                |

**Invalid submit wiring**: `useAppForm` gets `onSubmitInvalid`. When the sheet is closed, it waits one animation frame, so the errors have rendered, then calls `focusFirstInvalid()`. When the sheet is open, it sets a pending ref and closes the sheet; the sheet's `onCloseAutoFocus` then calls `preventDefault` and `focusFirstInvalid()`, because only at that point has the sheet released focus and the page. Either path fires the AC-25 toast when `focusFirstInvalid()` returns false. `SheetContent` already spreads its props.

**Deferred sections**: the first paint holds the bars and personal info. The other sections mount in a `useDeferredValue(true, false)` render that React splits into short tasks, so `/builder` never blocks input for long (AC-40). Until that pass lands, a strip link or `focusFirstInvalid()` finds nothing below personal info. The pass lands within a few frames of load, so this window is accepted.

**Moved item focus**: list keys are index based, so after a move the same DOM node shows a different item. Focus therefore goes to the item's new index one animation frame after the move. Move buttons and chip menu triggers carry `data-focus-key`, built from `sortableId` plus the control's name, and are found by that attribute. Do not set `id` on a chip menu trigger: Radix uses its own trigger id for the content's `aria-labelledby`. Chip menus call `preventDefault` in `onCloseAutoFocus` and focus by `data-focus-key`, so Radix does not return focus to the old index.

**Drag announcements**: `findMove` already maps ids to indexes; add `sortableIndex(prefix, id)` in `sortable-ids.ts` and build the `DndContext` announcements from it.

### Layout

| Measure                        | Value                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------- |
| Toolbar gap                    | `gap-1 sm:gap-2`, so the row fits 320px (AC-10)                              |
| Toolbar plus strip             | 3.5rem + 2.75rem = 6.25rem, both direct children of the page root            |
| `scroll-padding-top`           | 4.5rem below `md`, 7.25rem from `md` up                                      |
| `scroll-padding-bottom`        | 5.5rem                                                                       |
| Where the padding lives        | `html:has([data-builder-page])` in `src/index.css`, so only this page has it |
| Form and preview columns       | unchanged from spec 0009 (`max-w-5xl`, or two columns at `max-w-[1600px]`)   |
| Page bottom padding below `xl` | `pb-24`                                                                      |

### Copy

| Key                                   | EN                                                                                                     | PL                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `builder.changeTemplate`              | Change template, current: {{name}}                                                                     | Zmień szablon, obecny: {{name}}                                                                         |
| `builder.actions.label`               | More actions                                                                                           | Więcej działań                                                                                          |
| `builder.sectionNav.label`            | Resume sections                                                                                        | Sekcje CV                                                                                               |
| `builder.sectionNav.completed`        | Completed                                                                                              | Ukończono                                                                                               |
| `builder.sectionNav.personalInfo`     | Personal                                                                                               | Dane                                                                                                    |
| `builder.sectionNav.experiences`      | Experience                                                                                             | Doświadczenie                                                                                           |
| `builder.sectionNav.education`        | Education                                                                                              | Wykształcenie                                                                                           |
| `builder.sectionNav.skills`           | Skills                                                                                                 | Umiejętności                                                                                            |
| `builder.sectionNav.languages`        | Languages                                                                                              | Języki                                                                                                  |
| `builder.sectionNav.interests`        | Interests                                                                                              | Zainteresowania                                                                                         |
| `builder.sectionNav.gdprConsent`      | GDPR                                                                                                   | RODO                                                                                                    |
| `builder.validation.fixErrorsUnknown` | Something in your resume needs fixing before you can preview it.                                       | Coś w Twoim CV wymaga poprawy przed podglądem.                                                          |
| `builder.reorder.moved`               | Moved to position {{position}} of {{total}}                                                            | Przeniesiono na pozycję {{position}} z {{total}}                                                        |
| `builder.reorder.added`               | Added {{item}}                                                                                         | Dodano: {{item}}                                                                                        |
| `builder.reorder.removed`             | Removed {{item}}                                                                                       | Usunięto: {{item}}                                                                                      |
| `accessibility.moveUp`                | Move {{item}} up                                                                                       | Przesuń {{item}} w górę                                                                                 |
| `accessibility.moveDown`              | Move {{item}} down                                                                                     | Przesuń {{item}} w dół                                                                                  |
| `accessibility.moveLeft`              | Move left                                                                                              | Przesuń w lewo                                                                                          |
| `accessibility.moveRight`             | Move right                                                                                             | Przesuń w prawo                                                                                         |
| `accessibility.itemActions`           | Actions for {{item}}                                                                                   | Działania: {{item}}                                                                                     |
| `accessibility.dragInstructions`      | Press Space or Enter to pick up. Use the arrow keys to move, Space or Enter to drop, Escape to cancel. | Naciśnij spację lub Enter, aby chwycić. Przesuwaj strzałkami, upuść spacją lub Enterem, Escape anuluje. |
| `accessibility.dragPickedUp`          | Picked up item at position {{position}}                                                                | Chwycono element na pozycji {{position}}                                                                |
| `accessibility.dragOver`              | Over position {{position}}                                                                             | Nad pozycją {{position}}                                                                                |
| `accessibility.dragDropped`           | Dropped at position {{position}}                                                                       | Upuszczono na pozycji {{position}}                                                                      |
| `accessibility.dragCancelled`         | Move cancelled                                                                                         | Anulowano przenoszenie                                                                                  |

Delete `builder.processing`, `builder.progress.complete`, `builder.progress.incomplete`, `builder.template`, and `nav.backToTemplates` if nothing else uses them.

**Value sourcing**:

| Action             | Value               | Source                                                                                    |
| ------------------ | ------------------- | ----------------------------------------------------------------------------------------- |
| Section strip      | percent             | `calculateProgress(state.values)`, numbers unchanged                                      |
| Section strip      | check per section   | `isSectionComplete(id, state.values)`, AC-13                                              |
| Section strip      | active section      | `useActiveSection`, section tops against `scroll-padding-top`, or the link just activated |
| Template link      | template name       | `activeTemplateId` through `templates.<id>.name`                                          |
| Save status        | importing           | `pdfImport.isLoading`                                                                     |
| Save status        | saved time, failure | `autosave`, unchanged                                                                     |
| Save status        | manual save message | `autosave.lastSaved` while `autosave.isAutoSaved` is false                                |
| Add, remove notice | item name           | the chip's `name`, or the card's `sections.<id>.item` title                               |
| Preview CV         | submitting          | `state.isSubmitting`                                                                      |
| Invalid jump       | target              | first `[aria-invalid='true']` in DOM order, which is page order                           |
| Add focus          | field id            | `field.name` format, index 0 for experience, previous length for the others               |
| Remove focus       | target              | a ref on that section's Add button (`Button` spreads `ref`) or chip input                 |
| Move announcement  | position, total     | target index + 1, and `count` in `SortableList`                                           |

**Key invariants**:

- Templates and PDFs are untouched: no change under `src/features/templates/` and no change from `pnpm templates:previews --check`.
- The schema is untouched. Valid form still implies the three required fields are present, which is why dropping the 30% gate changes nothing about what can reach `/preview`.
- All resume storage still goes through `stored-resume.ts`, and the section strip never writes to storage.
- The section strip and buttons subscribe to primitives only (a boolean, a number), so typing does not redraw them.

**Security model**: not applicable. No new data leaves the browser, and resume data stays in `safeStorage` as today.

**Configuration required**: none.

**Critical test scenarios**:

- Happy path: fill the three required fields, activate the toolbar Preview CV, land on `/preview` with the stored resume, verifies **AC-22**, **AC-23**
- Fresh form: activate Preview CV with nothing typed, three required errors appear and focus is on first name; activate again after fixing only first name, focus moves to last name, verifies **AC-23**
- Sheet: failed `OpenPreviewButton` closes the sheet and focus is on the invalid field, verifies **AC-24**
- No target: an imported chip over 100 characters makes the form invalid, the toast shows, verifies **AC-25**
- Reset through the menu: focus enters the dialog and returns to the menu trigger, the backup survives, verifies **AC-8**, **AC-39**
- Import: spinner and `builder.loading` while pending, cleared on success and failure, verifies **AC-9**
- Active section: activating the last link shows it active on arrival, and at the page bottom the last section is active, verifies **AC-15**
- Enter in a chip input adds the chip and does not submit the form, verifies **AC-21**
- Removing the only item in a list still announces it, verifies **AC-28**
- Check marks: filling only first name adds to the percent but no check; adding a skill adds its check, verifies **AC-12**, **AC-13**
- Moves: Move up on a middle card swaps values, focus stays with the moved item, and the announcement names the position; moving to the top sends focus to Move down, verifies **AC-29**, **AC-31**
- Chips: the menu moves and removes, focus lands on the trigger at the new index, and on the input after removal, verifies **AC-28**, **AC-30**, **AC-31**
- Focus after add and remove for one card list, verifies **AC-27**, **AC-28**
- Redraws: typing leaves other cards and sections at their count, verifies **AC-38**

## Build plan

Tracer Bullet: the first slice ships the new page frame end to end. Each later slice lands one working piece, and the app stays shippable after each.

1. **Page frame and toolbar.** Solid root, remove the background and entrances, `scroll-padding`, the new toolbar with the template link, actions menu, controlled reset dialog, import status and `PreviewCvButton` (still with today's gate). Update the tests that click Save, Reset and Load PDF, satisfies **AC-1**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-10**, **AC-16**, **AC-37**
2. **Section strip.** `builder-sections.ts`, `isSectionComplete`, `SectionNav`, `useActiveSection`, delete `FormProgress`, and give `FormSectionCard` its anchors and focusable `h2`, satisfies **AC-11**, **AC-12**, **AC-13**, **AC-14**, **AC-15**, **AC-37**
3. **Sections and fields on tokens.** `FormSectionCard`, list items, empty states, fields, GDPR, Add button variants, heading levels, `aria-invalid` and `aria-describedby`, chip input limits, satisfies **AC-17**, **AC-18**, **AC-19**, **AC-20**, **AC-21**
4. **Preview CV always available.** Drop the gate, wire `onSubmitInvalid`, `focusFirstInvalid`, the sheet focus handling and the toast, satisfies **AC-22**, **AC-23**, **AC-24**, **AC-25**, **AC-26**
5. **Lists without a mouse.** `focusField`, add and remove focus, `ItemMoveControls`, card buttons, chip menu, live region, translated drag announcements, target sizes, satisfies **AC-27**, **AC-28**, **AC-29**, **AC-30**, **AC-31**, **AC-32**, **AC-33**, **AC-37**
6. **Live preview and dialogs on tokens.** Panel, sheet, body, page list, floating button, reset and error dialogs, satisfies **AC-34**, **AC-35**, **AC-36**
7. **Cleanup and guards.** Add the builder to `TOKEN_ONLY_FILES`, delete the parallax and shapes components, unused keys and classes, update `DESIGN.md`, then run `pnpm pre-commit` and `pnpm perf:lighthouse`, satisfies **AC-2**, **AC-3**, **AC-37**, **AC-38**, **AC-39**, **AC-40**

## Consequences

**Positive**:

- People can move around a long resume, and see what is left, from anywhere on the page.
- The toolbar fits a phone, and the sticky bars actually stick now that the root no longer clips.
- Nobody hits a silent grey button, and lists work with keyboard, touch and no dragging.
- Fewer repaints while typing, with no blur, background shapes or entrance work on this page.

**Negative / tradeoffs**:

- Load PDF, Save and Reset each take one extra tap, because they live in a menu.
- Removing a chip takes two taps instead of one, in exchange for a remove that is reachable on touch and by keyboard.
- Preview CV is clickable on an empty form, so a click can lead to errors instead of a preview. That is the intended way to find out what is missing.
- The focus handling depends on Radix close behavior and on index based ids, so it needs its tests kept alive.
- Around a dozen builder page tests change because of the menu and the second Preview CV button.

**Neutral**:

- No stored data moves, so there is no migration. Reverting the work restores the old page.
- The builder joins the lint guard, so raw colors can no longer return here.

## Follow-up

- [ ] Feature 15 (preview and export UI) can reuse this toolbar shape.
- [ ] After this ships, spec 0009's sticky panel offsets are superseded by AC-34; the panel numbers in that spec become history.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
