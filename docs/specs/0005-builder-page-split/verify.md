# Verify: Builder page split · spec 0005 · updated 2026-11-03

_Steps derived from spec 0005 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## Commands

- [ ] Check out the first commit only → `pnpm vitest run src/features/builder/builder-page.test.tsx` passes against the old page; on the branch head the same file passes unchanged (`git diff <first>..HEAD -- src/features/builder/builder-page.test.tsx` shows only additions for AC-9 and AC-10) → AC-1
- [ ] `grep -rn "@/routes" src/features/builder` → no matches → AC-10
- [ ] `pnpm lint` passes; append 251 code lines to a scratch copy of a builder file → lint fails with `max-lines`; revert → AC-2
- [ ] `pnpm vitest run eslint.config.test.ts` → the 251 line case fails, the 250 line case passes → AC-2
- [ ] `test ! -e src/features/builder/form-component-types.ts` and `grep -rnE "as unknown as|as (string|boolean)\b|as [A-Z][a-zA-Z]+Props\[\]" src/features/builder --include='*.tsx' --include='*.ts' | grep -v test` → no matches → AC-3
- [ ] `grep -rn "@dnd-kit" src/features/builder/form-sections | grep -v sortable-` → no matches → AC-5
- [ ] `grep -rnE "resumeData(_backup|_lastSaved)?'" src/features/builder` → no matches outside tests → AC-7
- [ ] `pnpm vitest run src/features/builder src/features/resume` → field, sortable, progress, storage and page tests pass → AC-4 to AC-9
- [ ] `pnpm pre-commit` passes and `perf:size` reports `/builder` at or under 270 KB → AC-11

## In the browser (`pnpm dev`, light and dark, EN and PL)

- [ ] Type a first name, last name and email → the progress bar and percent move with each field, and Preview unlocks at 30% without saving → AC-9
- [ ] Add, remove and drag reorder items in experience, education and languages (cards) and skills and interests (chips); reorder by keyboard (focus the grip, Space, arrows, Space) → order changes and the preview shows the new order → AC-4, AC-5
- [ ] Tab out of an empty required field → its error shows; untouched fields show none → AC-6
- [ ] In an experience description: type a letter, paste text into an empty field, press Enter mid text → `• ` rules as today, caret after the new bullet → AC-6
- [ ] Reset, then type in one field → the other fields stay empty; import a PDF, then type in one field → the imported values stay → AC-7, AC-8
- [ ] Save, wait 30 seconds after an edit, then reset → saved, autosaved and cleared states as on `main`; after reset, `resumeData_backup` is still in DevTools storage → AC-7
- [ ] Import a PDF exported from each of the three templates, then the same file again, then an 11MB file → the form fills twice, the big file shows the size error → AC-8
- [ ] Open `/builder?templateId=veterinary` and `/builder?templateId=nope` → the first shows the veterinary badge, the second the developer badge with the stored resume loaded (an intended change: `main` shows `nope`) → AC-10
- [ ] Compare the builder side by side with `main` at desktop and phone width, with reduced motion on and off → no visual difference → AC-11

## Added by /develop · 2026-11-03

- [ ] `grep -rn "from 'zod'" src/features/builder/builder-search.ts src/routes/builder.tsx` → no matches; `pnpm build && pnpm perf:size` keeps `/` and `/templates` within budget (zod in route search validation pushed both over) → AC-10, AC-11
- [ ] Open `/builder?templateId=nope` with a stored `default` resume → the URL becomes `/builder`, the badge shows the developer name, and Save stores `templateId: 'default'` → AC-10
- [ ] Add a skill, then Reset → the chip is gone right away, not only after the next keystroke; import a PDF with skills → the chips show right away (list sections subscribe to their array, since array mode fields skip `form.reset`) → AC-4, AC-7, AC-8
- [ ] Type the email first, then first and last name → the percent reads 10, 20, 30 as you type and Preview unlocks without the email being last → AC-9
- [ ] Open the gallery template page and the templates list, click Use template → `/builder?templateId=<id>` opens with that badge; from `/preview`, Back to editor no longer adds `edit=true` to the URL → AC-10
