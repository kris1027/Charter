# 0011. Template gallery refresh: landing composition on the app tokens, full sheets and an instant detail preview

**Date**: 2026-11-09
**Status**: Accepted

## Summary

This spec rebuilds the gallery and template detail pages with the same composition as the new home page (a tight headline, white paper sheets, pill buttons, open spacing), but with the app's existing spec 0004 colors, so the landing tokens stay on the home page. Each card shows the whole A4 page. The detail page shows a prebuilt image at once, then swaps to the real PDF on desktop, while phones keep the image and skip the heavy PDF engine. Cards get a smaller image file, the saved resume banner becomes a Continue editing link, and no new library or data storage is involved.

## Requirements

**User stories**:

- As a job seeker, I want to see each whole template at a glance, so that I can pick the one I really want.
- As a phone user, I want the detail page to show something reliable and quick, so that I never stare at a blank frame.
- As a returning visitor, I want a clear way back to my saved resume, so that I do not start over or wipe it by accident.
- As a keyboard or screen reader user, I want real links and one clear page heading, so that I can move through the gallery easily.

**Acceptance criteria**:

_Gallery page_

- **AC-1**: `/templates` renders, in this order: `GalleryNav`, a header, the saved resume notice when AC-10 applies, the cards. `GalleryNav` is sticky (`top-0 z-10`), with a solid `bg-background` and a bottom border. It holds the back link to `/` (`nav.backToHome`) on the left and `LanguageToggle` and `ThemeToggle` on the right, and contains no heading. The header is centered and holds the only `h1` on the page (`templates.pageTitle` as one whole string) and `templates.pageSubtitle`. The badge and the gradient word are gone.
- **AC-2**: Both gallery pages use only spec 0004 tokens plus the new `paper` token in _Tokens_. They use no `landing-*` token, no `font-landing`, no `ParallaxBackground`, no gradient and no `backdrop-blur`. `src/features/gallery/**/*.{ts,tsx}` is in `TOKEN_ONLY_FILES` and `pnpm lint` passes.
- **AC-3**: The cards follow `TEMPLATE_IDS` order in the grid from _Layout_. There are no filters. Each card shows, top to bottom: the sheet, an `h2` with `templates.<id>.name`, `templates.<id>.description` in full (no line clamp), and two pill buttons. The buttons line up across a row of cards regardless of description length.
- **AC-4**: The sheet shows the whole page 1 with no crop: A4 ratio from `PREVIEW_WIDTH` and `PREVIEW_HEIGHT`, `bg-paper`, `rounded-xl`, `shadow-raised`. Hover or focus on the sheet link changes only the shadow, to `shadow-overlay`. There is no zoom, lift, overlay, hover pill or bottom fade.
- **AC-5**: The sheet is a real link (TanStack `Link`) to `/templates/$templateId`, named by the image `alt`. Nothing on the page uses `role='link'`. The Preview button (`variant='outline'`) links to `/templates/$templateId`. The Use Template button (default variant) links to `/builder?templateId=<id>`. Each button has `aria-describedby` pointing at its card's `h2`, whose id is `template-name-<id>`.
- **AC-6**: `pnpm templates:previews` also writes `<id>-<lang>-card.webp` for every template and language, 720px wide, 1019px high, downscaled from the full size canvas with `imageSmoothingQuality = 'high'` at `WEBP_QUALITY`. `manifest.json` lists all 12 files, so `--check` fails when one is missing. The full size files keep their pixels. `preview-images.ts` exports `PREVIEW_CARD_IMAGES` with the same shape as `PREVIEW_IMAGES`.
- **AC-7**: Each card image uses `src` set to the card file, `srcset` (`card` at `720w`, full at `1190w`) and the `sizes` value in _Layout_, follows the current language, and keeps `width` and `height` attributes. The first card is `loading='eager'` with `fetchPriority='high'`; the others are `loading='lazy'`, since on phones they are off screen. All use `decoding='async'`. Lighthouse reports a page CLS (layout shift score) under 0.01 for `/templates` with a saved resume present.
- **AC-8**: When a sheet image fails to load, its `onError` sets the `hidden` attribute on the `<img>`, and the white sheet stays at its full size with no broken image icon. The sheet then takes the image's `alt` as `role='img'` with `aria-label`, so the link in AC-5 keeps its name.
- **AC-9**: Neither gallery page has an entrance animation. `src/features/gallery/` imports nothing from `motion/react`. The only transition the gallery adds is the shadow in AC-4; `Button` keeps its own color transition.

_Saved resume notice_

- **AC-10**: The notice shows only when `loadStoredResume()` returns a resume, read during the first render so it never pushes the cards down. It is a `Card` holding `savedData.title`, the last saved line from AC-11, and a pill link `savedData.continue` to `/builder` with no `templateId`, so the builder keeps the stored template: with no URL template, its toolbar, live preview, reset and PDF import fallback all use the stored one (this replaces the `developer` toolbar fallback in spec 0005, AC-10). The gallery has no reset control and writes nothing to storage. Below `sm` its content stacks.
- **AC-11**: The last saved line (`savedData.lastSaved`) renders only when `readLastSaved()` returns a valid date. Its time comes from `formatTimeAgo(date, lang, now)`: under 1 minute or in the future returns `null` and the line uses `savedData.justNow`; under 1 hour, 1 day and 7 days it uses `Intl.RelativeTimeFormat` (`numeric: 'always'`) in minutes, hours and days; from 7 days on it uses a medium date from `Intl.DateTimeFormat`, in the app language through `localeTags`. In English, 1 minute reads `1 minute ago`; in Polish, 2 minutes reads `2 minuty temu`.

_Detail page_

- **AC-12**: `/templates/$templateId` renders `GalleryNav` with the back link to `/templates` (`nav.backToTemplates`) and the toggles. From `lg` up the page fills the viewport with no page scroll at 640px height or more, and scrolls normally below that: a left column holds the `h1` (`templates.<id>.name`), `templates.<id>.description` and a Use Template pill to `/builder?templateId=<id>`, and a right panel fills the height under the nav. Below `lg` the same content stacks, text first, then the sheet (AC-14). The page has one `h1`.
- **AC-13**: At every width the prebuilt full size image of the current template and language (no `srcset`) shows at once, `loading='eager'`, `fetchPriority='high'`, with `alt` from `templates.previewAlt`. From `lg` up, when the PDF has loaded in its iframe it replaces the image inside the same panel, and the panel box does not change size. The PDF scrolls inside the panel, so page 2 of the veterinary sample can be reached. The iframe has `title` from `templates.pdfTitle`.
- **AC-14**: Below `lg` (`useMediaQuery('(min-width: 1024px)')` is false, read correctly on the first render, so nothing flips) `LazyGalleryPdfViewer` is not mounted, the PDF engine chunks are not requested, and the page shows only the image of page 1 on a sheet, `w-full max-w-[480px]`, centered. Resizing or rotating past 1024px mounts the viewer, by design.
- **AC-15**: From `lg` up, if the viewer chunk fails to load, or the PDF render fails, or the iframe never finishes loading, the image stays in the panel. There is no timeout. No error text, toast or error fallback appears, and Use Template still works.
- **AC-16**: Changing language updates the image, the text and, from `lg` up, the PDF, with no reload. The previous PDF stays visible until the new one has loaded.
- **AC-17**: An unknown `templateId` shows `GalleryNav` with the back link to `/templates`, an `h1` with `templates.notFound`, and a default variant pill Button link `nav.backToTemplates`, in tokens and with no animation.

_Everywhere_

- **AC-18**: Every visible string goes through `t()`. The keys in _Copy_ are added or changed in both locales and the removed keys are gone from both.
- **AC-19**: Route titles, Open Graph, Twitter and canonical tags for both routes, and `sitemap.xml`, are unchanged.
- **AC-20**: `/preview`, `LazyTemplateViewer` and `TemplateViewer` are not changed by this work. `pnpm templates:previews --diff` reports zero changes.
- **AC-21**: Both routes stay within `perf/budgets.json` with no raise. No `lazyEngines` chunk is in their first load. Lighthouse floors from spec 0003 pass and `pnpm pre-commit` passes.
- **AC-22**: At 320px both pages have no sideways scroll. Every link and button is reachable by keyboard with the visible focus outline from the global `:focus-visible` rule in `index.css`, in both themes.
- **AC-23**: Code this work leaves unused is removed: `TemplateCardPreview`, `blur-in` keyframes and `.animate-blur-in`, the old card gradient and icon data. `ParallaxBackground`, `fade-in-up` and `gradient-shift` stay, since the builder or preview use them. `DESIGN.md` documents `paper` and says the gallery follows the landing composition on app tokens.

## Decision

**Chosen option**: Option 1: Rebuild both pages in place, with the landing composition on spec 0004 tokens.

The landing tokens stay on the home page, which closes the open question from spec 0010. The gallery and detail pages share a small set of new components, and the detail page shows the prebuilt image until the PDF is ready.

**Implementation skills**: `react-pdf` (`molefrog/skills`, `.agents/skills/react-pdf/`) · `tanstack-router` (`tanstack-skills/tanstack-skills`, `.agents/skills/tanstack-router/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

## Feature design

**Data model**: no change to the saved shape and no new storage key. Six new generated image files.

**State transitions** (detail panel, from `lg` up):

`image` → `image, viewer loading` → `image, PDF rendering` → `PDF shown`. Any failure stops at the image (AC-15). `PDF shown` is final for that mount: on a language change the current PDF stays until the new one loads (AC-16).

### Components

| File                                                     | Change                                                 | Interface                                                                                                                                                                                                                                                                |
| -------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/features/gallery/gallery-nav.tsx`                   | new                                                    | `GalleryNavProps = { backTo: '/' \| '/templates'; backLabel: string }`                                                                                                                                                                                                   |
| `src/features/gallery/template-sheet.tsx`                | new, replaces `template-card-preview.tsx` and its test | `TemplateSheetProps = { templateId: TemplateId; sizes?: string; isPriority?: boolean; className?: string }`. Renders the `bg-paper` A4 box and the `<img>`, with AC-7 and AC-8. With `sizes` it uses the card file and `srcset`; without it, the full file alone (AC-13) |
| `src/features/gallery/template-card.tsx`                 | new                                                    | `TemplateCardProps = { templateId: TemplateId; isPriority: boolean }`                                                                                                                                                                                                    |
| `src/features/gallery/saved-resume-notice.tsx`           | new                                                    | no props; reads storage once, in a `useState` initializer                                                                                                                                                                                                                |
| `src/features/gallery/templates-page.tsx`                | rewrite                                                | composes the above                                                                                                                                                                                                                                                       |
| `src/features/gallery/template-page.tsx`                 | rewrite                                                | composes the above, and the panel from _Detail panel_                                                                                                                                                                                                                    |
| `src/features/templates/pdf/gallery-pdf-viewer.tsx`      | new, default export                                    | `GalleryPdfViewerProps = TemplatePdfInput & { title: string; placeholder: ReactNode }`; see _Detail panel_                                                                                                                                                               |
| `src/features/templates/pdf/lazy-gallery-pdf-viewer.tsx` | new                                                    | `LazyGalleryPdfViewer`, `React.lazy` over the viewer, with `placeholder` as the `Suspense` fallback                                                                                                                                                                      |
| `perf/budgets.json`                                      | change                                                 | adds a `lazyEngines` entry matching `src/features/templates/pdf/gallery-pdf-viewer.tsx`                                                                                                                                                                                  |
| `src/features/resume/stored-resume.ts`                   | add                                                    | `readLastSaved(): Date \| null`, `null` for a missing or unparsable value                                                                                                                                                                                                |
| `src/lib/date-format.ts`                                 | add                                                    | `formatTimeAgo(date: Date, lang: AppLang, now?: Date): string \| null` (AC-11), reusing `localeTags`                                                                                                                                                                     |
| `src/features/templates/previews/preview-images.ts`      | add                                                    | `PREVIEW_CARD_IMAGES`, six more static imports                                                                                                                                                                                                                           |
| `scripts/templates/build-previews.ts`                    | change                                                 | writes the card file from the same canvas; `files` lists both sizes                                                                                                                                                                                                      |
| `eslint.config.js`                                       | change                                                 | adds the gallery folder to `TOKEN_ONLY_FILES`                                                                                                                                                                                                                            |
| `src/index.css`, `DESIGN.md`                             | change                                                 | _Tokens_                                                                                                                                                                                                                                                                 |

### Detail panel

`GalleryPdfViewer` uses `BlobProvider` rather than `PDFViewer`, because `PDFViewer` gives no signal that its PDF is ready and shows a blank frame until then:

```tsx
<BlobProvider document={<TemplatePDF {...input} />}>
    {({ url, error }) => (/* relative h-full w-full box */)}
</BlobProvider>
```

- The box renders `placeholder` while `error` is set or until the iframe's `onLoad` has fired once. That loaded flag never resets. `usePDF` keeps the previous `url` until a new render finishes, so the iframe stays mounted and shows the old PDF until then.
- When `url` is set and there is no error, it renders `<iframe src={`${url}#toolbar=0`} title={title} width='100%' height='100%'>`, absolutely positioned over the placeholder, with `opacity-0` until the first `onLoad`.
- The iframe is mounted only with a `url`. CSP does not change, since `PDFViewer` already used a `blob:` iframe.
- `onLoad` means the frame loaded, not that the browser finished drawing the PDF, so a short blank moment on desktop is accepted.
- `template-page.tsx` wraps `LazyGalleryPdfViewer` in `ErrorBoundary` (`@/components/ui/error-boundary`) with `fallback={() => sheet}`, so a failed chunk also leaves the image.
- From `lg` up, the sheet inside the panel takes its size from the panel height: `mx-auto h-full` with the A4 ratio set by `aspectRatio`, capped by `max-w-full`, with `object-contain` on the image.

### Layout

| Part                  | Rule                                                                                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page                  | root `bg-background text-foreground min-h-dvh overflow-x-clip`; content `mx-auto max-w-[1100px] px-6`                                                                                                      |
| Header                | `font-display`, `text-[clamp(36px,5vw,56px)] leading-[1.05] font-bold tracking-[-0.04em] text-balance`; subtitle `text-muted-foreground text-lg`                                                           |
| Grid                  | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14`; below `sm` the sheet is `w-[min(320px,80vw)]`, centered; card text is centered                                                          |
| Pills                 | `Button` with `rounded-full`                                                                                                                                                                               |
| Card `sizes`          | `(min-width: 1024px) 340px, (min-width: 640px) calc(50vw - 40px), min(320px, 80vw)`                                                                                                                        |
| Detail grid (`lg` up) | root `lg:flex lg:h-dvh lg:min-h-[640px] lg:flex-col`; main `lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-12`; right panel `bg-muted overflow-hidden rounded-xl border` |

### Tokens

Add `--paper: oklch(1 0 0)` in `:root`, not redefined in `.dark`, exposed as `--color-paper` through `@theme inline`. It stands for the printed page, which is always white, so it stays white in dark mode. It carries no text, so it needs no contrast pair. Document it in `DESIGN.md`.

### Copy

| Key                              | EN                                  | PL                                  |
| -------------------------------- | ----------------------------------- | ----------------------------------- |
| `savedData.continue` (new)       | Continue editing                    | Kontynuuj edycję                    |
| `templates.pdfTitle` (new)       | {{name}}, sample PDF                | {{name}}, przykładowy PDF           |
| `templates.previewAlt` (changed) | {{name}} preview with sample resume | {{name}}, podgląd z przykładowym CV |

Remove from both locales: `templates.badge`, `templates.title`, `savedData.minuteAgo`, `minutesAgo`, `hourAgo`, `hoursAgo`, `dayAgo`, `daysAgo`. A search must confirm each is unused first. `savedData.title`, `lastSaved` and `justNow` stay.

**API surface**: no endpoints. Routes stay `/templates` and `/templates/$templateId`, and `/builder` keeps its `?templateId=` contract.

**Value sourcing**:

| Action       | Value produced or displayed | Source                                                                                            |
| ------------ | --------------------------- | ------------------------------------------------------------------------------------------------- |
| Card, detail | template list and order     | `TEMPLATE_IDS`                                                                                    |
| Card, detail | name, description, alt      | `t('templates.<id>.*')`, `t('templates.previewAlt')`                                              |
| Card, detail | image files                 | `PREVIEW_CARD_IMAGES`, `PREVIEW_IMAGES`, keyed by `templateId` and `normalizeLang(i18n.language)` |
| Card, detail | reserved image size         | `PREVIEW_WIDTH`, `PREVIEW_HEIGHT`                                                                 |
| Card, detail | Use Template target         | `/builder`, `search: { templateId }`                                                              |
| Notice       | whether it shows            | `loadStoredResume() !== null`                                                                     |
| Notice       | last saved date             | `readLastSaved()` from `resumeData_lastSaved`                                                     |
| Notice       | time text                   | `formatTimeAgo` with `normalizeLang(i18n.language)`                                               |
| Notice       | Continue target             | `/builder` with no search; the builder reads the stored `templateId`                              |
| Detail       | template                    | route param, checked by `isTemplateId`                                                            |
| Detail       | sample resume in the PDF    | `SAMPLE_RESUMES[templateId][lang]`, `compactScale={0}`                                            |
| Detail       | whether the PDF mounts      | `useMediaQuery('(min-width: 1024px)')`                                                            |

**Key invariants**:

- On the detail page the PDF engine is reached only through `LazyGalleryPdfViewer`, and only from `lg` up.
- Image and PDF share one panel box, so the swap never changes its size.
- A failure on the detail page always leaves the image.
- The gallery folder never writes to storage.
- Resume templates themselves do not change; only their generated preview sizes do.

**Security model**: public pages with no accounts. Resume data stays in the browser, and the gallery only checks that a saved resume exists and reads its saved time. CSP is unchanged, and nothing new is sent off the site. GDPR scope is unchanged.

**Configuration required**: none.

**Critical test scenarios**:

- Gallery in EN renders one `h1`, three `h2`, and real links with the correct `href` values, verifies **AC-1**, **AC-3**, **AC-5**
- `TemplateSheet` in PL has both `srcset` candidates, `width`, `height`, and the priority attributes, verifies **AC-7**
- Firing `error` on a sheet image hides it and keeps the sheet, verifies **AC-8**
- With a saved resume, the notice shows and links to `/builder` with no search and no reset control; with none, or with broken JSON, it is absent, verifies **AC-10**
- `formatTimeAgo` returns `null` for 30 seconds and a future date, `2 minuty temu` for 2 minutes in PL, and a date at 7 days, verifies **AC-11**
- `readLastSaved` returns `null` for a garbage value, verifies **AC-11**
- Detail page below `lg` (mocked `useMediaQuery`) shows the image and never mounts `LazyGalleryPdfViewer`, verifies **AC-14**
- `GalleryPdfViewer` with a mocked `BlobProvider` shows the placeholder until iframe `onLoad`, keeps it when `error` is set, and does not bring it back when `url` changes after the first load, verifies **AC-13**, **AC-15**, **AC-16**
- Unknown id shows the not found heading and back link, verifies **AC-17**
- `pnpm templates:previews --check` fails when a card file is deleted, verifies **AC-6**

## Build plan

Tracer Bullet: the first slice ships the new gallery page end to end. Each later slice adds one more thing and keeps the app working.

1. **Gallery end to end.** Add `paper`, build `GalleryNav`, `TemplateSheet` (full image only for now) and `TemplateCard`, and rewrite `templates-page.tsx`. Keep the old saved banner for one step, so nothing is lost, satisfies **AC-1**, **AC-3**, **AC-4**, **AC-5**, **AC-8**, **AC-9**, **AC-22**
2. **Saved notice.** Add `readLastSaved` and `formatTimeAgo`, build `SavedResumeNotice` with its keys, and delete the banner and its direct storage writes, satisfies **AC-10**, **AC-11**, **AC-18**
3. **Card images.** Update the script, run `pnpm templates:previews`, commit the six files and `manifest.json`, add `PREVIEW_CARD_IMAGES`, and switch `TemplateSheet` to `srcset`, satisfies **AC-6**, **AC-7**, **AC-20**
4. **Detail page.** Add `GalleryPdfViewer`, `LazyGalleryPdfViewer` and the `lazyEngines` entry, then rewrite `template-page.tsx` with the panel, `ErrorBoundary`, phone behaviour and not found state, satisfies **AC-12**, **AC-13**, **AC-14**, **AC-15**, **AC-16**, **AC-17**, **AC-20**, **AC-22**
5. **Cleanup and guards.** Delete unused keys, classes and `TemplateCardPreview`, add the gallery to `TOKEN_ONLY_FILES`, update `DESIGN.md`, then run `pnpm pre-commit` and `pnpm perf:lighthouse`, satisfies **AC-2**, **AC-18**, **AC-19**, **AC-21**, **AC-23**

## Consequences

**Positive**:

- You can judge a whole template from its card, and the detail page is never blank.
- Phones skip the PDF engine on the detail page and avoid a frame that many of them cannot draw.
- A card image drops from about 115 KB to about 55 KB on desktops, tablets and 2x phones.
- The double `h1`, the fake link, the direct storage writes and the wrong Polish plurals are fixed.

**Negative / tradeoffs**:

- The home page and the gallery keep different colors and fonts, even though their layouts now match.
- Phones see only page 1, so page 2 of the veterinary sample is not visible there.
- Phones above roughly 2x density still pick the full size image, so they do not get the saving.
- Six more generated files sit in the repo, about 330 KB.
- Reset leaves the gallery, so you must open the builder to clear a resume.
- The app now has two on screen PDF viewers, one for `/preview` and one for the detail page, until feature 15 decides whether to merge them.
- On desktop, a short blank moment is possible between the iframe loading and the browser drawing the PDF.

**Neutral**:

- `template-previews` stays at 12 cache entries, which holds all 12 files. A browser uses one card size per template, so there is room to spare in practice.
- No migration is needed, and one revert undoes each slice.

## Follow-up

- [ ] The home page hero could use `PREVIEW_CARD_IMAGES` for its side cards. Left out to keep this change away from spec 0010's page.
- [ ] Features 14 and 15 can reuse this pill and sheet language if it holds up.
- [ ] At feature 15, decide whether `/preview` should move to `GalleryPdfViewer` so there is one viewer.
- [ ] If you add a fourth template or more, revisit filters using `SegmentedControl` (spec 0004 expected them here).

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
