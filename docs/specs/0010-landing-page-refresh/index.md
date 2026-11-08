# 0010. Landing page refresh: scroll told redesign on landing only tokens and real template images

**Date**: 2026-11-08
**Status**: Accepted

## Summary

This spec rebuilds the home page from your Claude Design file ([design-source.html](design-source.html)): a pinned hero with real template images, a statement, six dark feature cards, pinned "how it works" steps, stats, and a closing call to action. Its Apple style colors and Space Grotesk font are added as tokens (named design values) used only on this page, so the builder, gallery and preview do not change. The design is adjusted where it clashed with your rules: text never slides with scroll, phones and reduced motion get plain stacked sections, and low contrast colors are fixed. No new library, no data storage and no SEO change are involved.

## Requirements

**User stories**:

- As a job seeker, I want the home page to show real CV output and a clear next step, so that I trust the tool and start building.
- As a phone user, I want a page that reads as normal sections, so that I am never stuck scrolling through held screens.
- As a visitor who prefers less motion or uses a keyboard, I want all content visible and reachable, so that the effects never hide anything from me.

**Acceptance criteria**:

- **AC-1**: `/` renders, in this order: hero, statement, features, how it works, stats, closing call to action, footer. Language and theme toggles stay at the top right, restyled only where needed. The page has one `h1` (the hero headline; the site name above it is a plain paragraph), section headings are `h2` and card and step titles are `h3`.
- **AC-2**: The hero shows the site name, headline on two lines (second line muted), subtitle, one primary button to `/templates`, a text link with a chevron that jumps to `#how`, and the three trust items (no sign up, free, export to PDF). The hero has no entrance animation.
- **AC-3**: The hero's three fanned cards are real previews for the current language: `default` in the center, `developer` left (rotated -8deg), `veterinary` right (rotated 8deg). Changing language swaps them. The center image loads eagerly with `fetchPriority='high'`; side images use `loading='lazy'` and `fetchPriority='low'`, and are hidden below `lg` by CSS alone (`hidden lg:block`), so phones never request them. Each `img` has `alt=''` and `PREVIEW_WIDTH` and `PREVIEW_HEIGHT`, so nothing shifts while loading. Each card has a white background, so a failed or offline image shows a blank white sheet with no broken icon.
- **AC-4**: At the `lg` breakpoint and up, with motion allowed, the hero is 200vh tall with a sticky 100vh stage (`min-height` 640px). Over the section's scroll, the stage moves up 260px and scales to 1.25, side cards rise 35vh and the center card 12vh.
- **AC-5**: Hero text changes only in opacity, from 1 to 0 over the first 45.45% of hero scroll, and never translates or scales. While scroll effects are on, when focus enters the hero text and `window.scrollY` is past the hero's top, the page calls `window.scrollTo({ top: heroTop, behavior: 'instant' })`, where `heroTop` is the section's `getBoundingClientRect().top + window.scrollY`, so the focused link is visible. All other text on the page has no scroll linked motion; it enters once through `fadeInUp` or `fadeInScale` with `viewport: { once: true }` and does not replay.
- **AC-6**: Features: a statement block, then a heading on two lines, then six cards in this order: templates, dark mode, PDF, bilingual, autosave, privacy, in an auto fitting grid (minimum column 320px, or full width below that). Each card has its colored `h3` label, description and decorative visual from the design. Visuals are `aria-hidden`. Only the non text visuals of the templates and dark mode cards use parallax, through `useParallax`.
- **AC-7**: At `lg` and up with motion allowed, how it works is 300vh with a sticky stage (`min-height` 560px), and `id='how'` sits on the outer section at every width, so the hero link lands on step 1. Scroll progress below 0.34 activates step 1, below 0.67 step 2, otherwise step 3. The active step has full color and `aria-current='step'`; inactive steps use `--landing-fg-2` (never reduced opacity). A progress bar follows scroll. The drawn white card fills per _Steps card behavior_, rotates and moves per _Scroll effects_, and is `aria-hidden`. The download pill is text, so it sits outside the moving card and does not move with scroll.
- **AC-8**: Stats show, in order: the template count from `TEMPLATE_IDS.length` with its label, `100%` with its label, `PL/EN` with its label. Numbers do not move with scroll. The `5 min` stat and its strings are gone.
- **AC-9**: The closing section has its heading, subtitle and one button to `/templates`. The footer shows `SEO_DEFAULTS.siteName` and the privacy line.
- **AC-10**: Every color on the page comes from the tokens in _Landing tokens_, defined in `:root` and `.dark` and exposed through `@theme inline`. `src/features/landing/**` is in `TOKEN_ONLY_FILES`. Every pair in _Contrast pairs_ is added to `src/lib/design-tokens.test.ts` and passes. `DESIGN.md` documents the tokens and says that they are for the landing page only.
- **AC-11**: The page uses self hosted Space Grotesk, including Polish characters, with `font-display: swap`. No request leaves the site's origin, and `vercel.json` and `vite.config.ts` CSP values do not change. Other pages do not use the font.
- **AC-12**: Below `lg`, no section is pinned or moved by scroll: the hero shows text then the center image only (side images are not downloaded), all three steps show as active, and the drawn card shows its final state with the pill visible. At 320px wide there is no horizontal page scroll.
- **AC-13**: With `prefers-reduced-motion: reduce` at any width, the page renders as in AC-12 and no parallax runs. The one difference is that at `lg` and up the three hero cards still show, fanned and static.
- **AC-14**: If the motion engine fails or stalls, all headings, text, buttons and steps remain visible, and pinned sections still lay out through CSS.
- **AC-15**: Every visible string goes through `t()` with the keys in _Copy_ present in both locales, except the site name. Removed keys are deleted from both locales.
- **AC-16**: Title, Open Graph, Twitter and canonical metadata for `/`, the structured data in `__root.tsx`, and `sitemap.xml` are unchanged.
- **AC-17**: The old hero mockup and landing only code are removed: `pulse-glow` and `draw-line` keyframes and their classes, plus any other piece that a search proves unused after the rebuild. `GeometricShapes`, `float`, `float-reverse`, `gradient-shift`, `blur-in` and `fade-in-up` stay if another page or component still uses them.
- **AC-18**: `/` stays within its `perf/budgets.json` limit with no lazy engine in first load, Lighthouse floors from spec 0003 still pass, and `pnpm pre-commit` passes. A budget raise must carry a reason naming spec 0010.

## Decision

**Chosen option**: Option 2: replace the page directly, one section at a time, on a new section file split.

Rebuild `src/features/landing/` from the stored design, using landing only tokens, self hosted Space Grotesk, `motion` scroll hooks and CSS `sticky`, with existing gallery previews as the hero images.

**Implementation skills**: `vite` (`antfu/skills`, `.agents/skills/vite/`) · `tanstack-router` (`tanstack-skills/tanstack-skills`, `.agents/skills/tanstack-router/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Design source**: [design-source.html](design-source.html), a copy of `CV Builder.dc.html` from `https://claude.ai/design/p/90b8fbc3-e944-4e1a-ae04-b50273a483e1`. Use it for spacing, type sizes and layout. Where it disagrees with this spec, this spec wins. Its `support.js` is the mockup runtime and has no design content. Never import from the file.

### Deliberate differences from the design

| Design                                      | This spec                                        | Why                                     |
| ------------------------------------------- | ------------------------------------------------ | --------------------------------------- |
| Three drawn hero cards, one dark            | Three real previews, all white                   | Real output; templates are always white |
| Hero button to `#start`, last button to `#` | Both go to `/templates`                          | Your choice                             |
| Headline slides and scales                  | Opacity only                                     | Text parallax rule                      |
| `.pdf` word and stat numbers have parallax  | Static                                           | Text parallax rule                      |
| Reveals replay on scroll                    | Enter once                                       | Project animation rule                  |
| Floating theme button only                  | Existing language and theme toggles at top right | Language must stay reachable            |
| Inactive steps at 0.2 opacity               | `--landing-fg-2` color                           | 0.2 opacity fails AA                    |
| Button hover `#0077ed`                      | `#0068d1`                                        | White text on `#0077ed` is only 4.32:1  |
| Small grey text `#86868b`                   | `--landing-fg-2`                                 | `#86868b` is only about 3.5:1 on light  |
| Step numbers `#0071e3`                      | `--landing-link`                                 | `#0071e3` is 4.47:1 on black            |
| Hero label orange in both themes            | `--landing-eyebrow`, lighter in dark             | Stays readable on black                 |
| `5 min, Average time`                       | Template count                                   | Unmeasured claim                        |
| `Folio CV Builder`, `CV Builder`            | `SEO_DEFAULTS.siteName`                          | One product name                        |
| Google Fonts link                           | Self hosted                                      | CSP, privacy message                    |
| Hero text `max-width: 900px`                | `1000px`                                         | At 900px the EN headline takes 3 lines  |
| PL chip text `#86868b`                      | `--landing-showcase-fg`                          | `#86868b` on the chip is only 3.85:1    |
| Download pill moves with the card           | Static, outside the card                         | Text parallax rule                      |
| Custom scroll listener and DOM queries      | `useScroll`, `useTransform`, CSS `sticky`        | Project motion pattern                  |

### File layout

All in `src/features/landing/`: `landing-page.tsx` (order only), `hero-section.tsx`, `statement-section.tsx`, `features-section.tsx`, `feature-visuals.tsx`, `how-it-works-section.tsx`, `steps-card.tsx`, `stats-section.tsx`, `closing-section.tsx`, `landing-cta-link.tsx`, `landing-footer.tsx`, `use-scroll-effects.ts`. Components that use a motion value are small `m.*` components, each with its own hook call.

### Sizes and imports

- **Hero stage**: width `min(900px, 92vw)`, height 560px, 8vh below the text, sticky at `top: 0`, transform origin center. Card `y` adds to the stage's `y`.
- **Hero cards**: A4 ratio from `PREVIEW_WIDTH` and `PREVIEW_HEIGHT`. Side cards are 28% wide, 4% from their edge, 90px from the stage top, radius 14px. The center card is 38% wide, centered, at the stage top, radius 16px. Below `lg`, the center card is `min(320px, 80vw)` wide in normal flow.
- **Features**: max width 1100px, grid gap 20px, card minimum height 440px, radius 28px, padding 36px. Card visual sizes and positions come from the matching card in the design copy.
- **Steps card**: width `min(360px, 80vw)`, radius 18px, padding 30px. Name bars 70% and 45%, section bars 28% and 32%, body bars 1 to 6 at 100%, 92%, 96%, 98%, 84% and 90%.
- **Type sizes, spacing and letter spacing**: from the matching element in the design copy.
- **Imports**: `PREVIEW_IMAGES`, `PREVIEW_WIDTH`, `PREVIEW_HEIGHT` from `@/features/templates/previews/preview-images`; `normalizeLang` from `@/lib/app-lang`; `TEMPLATE_IDS` from `@/lib/template-ids`; `SEO_DEFAULTS` from `@/lib/seo`; `useParallax` from `@/hooks/use-parallax`; `useMediaQuery` from `@/hooks/use-media-query`.

### Landing tokens

Add to `:root` (Light) and `.dark` (Dark), named exactly as below, as raw OKLCH. Tailwind names are `--color-<name>`. Hex is for reading only.

| Token                                                                                                             | Light                                                                                                                                                           | Dark                       | Hex (light / dark) and use                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--landing-bg`                                                                                                    | `oklch(0.989 0.003 286.4)`                                                                                                                                      | `oklch(0 0 0)`             | `#fbfbfd` / `#000`, page                                                                                                                             |
| `--landing-bg-2`                                                                                                  | `oklch(0.971 0.003 286.4)`                                                                                                                                      | `oklch(0.174 0.004 286)`   | `#f5f5f7` / `#101012`, stats, footer                                                                                                                 |
| `--landing-fg`                                                                                                    | `oklch(0.232 0.004 286.1)`                                                                                                                                      | `oklch(0.971 0.003 286.4)` | `#1d1d1f` / `#f5f5f7`, text                                                                                                                          |
| `--landing-fg-2`                                                                                                  | `oklch(0.54 0.008 286.1)`                                                                                                                                       | `oklch(0.711 0.007 286.2)` | `#6e6e73` / `#a1a1a6`, secondary, small text                                                                                                         |
| `--landing-muted`                                                                                                 | `oklch(0.622 0.007 286.2)`                                                                                                                                      | same                       | `#86868b`, large headline text only                                                                                                                  |
| `--landing-link`                                                                                                  | `oklch(0.522 0.177 255.8)`                                                                                                                                      | `oklch(0.669 0.181 251.8)` | `#0066cc` / `#2997ff`, link, step number                                                                                                             |
| `--landing-eyebrow`                                                                                               | `oklch(0.557 0.166 42.5)`                                                                                                                                       | `oklch(0.705 0.191 37.5)`  | `#bf4800` / `#ff6b3d`, hero label                                                                                                                    |
| `--landing-line`                                                                                                  | `oklch(0 0 0 / 0.08)`                                                                                                                                           | `oklch(1 0 0 / 0.12)`      | borders                                                                                                                                              |
| `--landing-track`                                                                                                 | `oklch(0.932 0.007 286.3)`                                                                                                                                      | `oklch(0.294 0.004 286.2)` | `#e8e8ed` / `#2c2c2e`, progress track                                                                                                                |
| `--landing-accent`                                                                                                | `oklch(0.563 0.193 256.2)`                                                                                                                                      | same                       | `#0071e3`, button, progress                                                                                                                          |
| `--landing-accent-hover`                                                                                          | `oklch(0.53 0.181 256)`                                                                                                                                         | same                       | `#0068d1`, button hover                                                                                                                              |
| `--landing-accent-fg`                                                                                             | `oklch(1 0 0)`                                                                                                                                                  | same                       | white, button text                                                                                                                                   |
| `--landing-showcase-bg`                                                                                           | `oklch(0 0 0)`                                                                                                                                                  | `oklch(0.15 0.002 286.1)`  | `#000` / `#0b0b0c`, features section                                                                                                                 |
| `--landing-showcase-card`                                                                                         | `oklch(0.201 0.002 286.2)`                                                                                                                                      | same                       | `#161617`, feature card                                                                                                                              |
| `--landing-showcase-fg`                                                                                           | `oklch(0.971 0.003 286.4)`                                                                                                                                      | same                       | `#f5f5f7`, text on features                                                                                                                          |
| `--landing-showcase-muted`                                                                                        | `oklch(0.622 0.007 286.2)`                                                                                                                                      | same                       | `#86868b`, muted text on features                                                                                                                    |
| `--landing-showcase-line`                                                                                         | `oklch(0.322 0.005 286.1)`                                                                                                                                      | same                       | `#333336`, divider                                                                                                                                   |
| `--landing-showcase-chip`                                                                                         | `oklch(0.294 0.004 286.2)`                                                                                                                                      | same                       | `#2c2c2e`, chip                                                                                                                                      |
| `--landing-blue`, `--landing-purple`, `--landing-orange`, `--landing-green`, `--landing-yellow`, `--landing-pink` | `oklch(0.669 0.181 251.8)`, `oklch(0.656 0.227 312.4)`, `oklch(0.705 0.191 37.5)`, `oklch(0.756 0.208 147)`, `oklch(0.885 0.181 94.8)`, `oklch(0.658 0.232 16)` | same                       | `#2997ff`, `#bf5af2`, `#ff6b3d`, `#30d158`, `#ffd60a`, `#ff375f`, card labels in that order: templates, dark mode, PDF, bilingual, autosave, privacy |
| `--landing-paper`                                                                                                 | `oklch(1 0 0)`                                                                                                                                                  | same                       | white, CV sheets                                                                                                                                     |
| `--landing-paper-ink`                                                                                             | `oklch(0.232 0.004 286.1)`                                                                                                                                      | same                       | `#1d1d1f`, drawn name bar                                                                                                                            |
| `--landing-paper-sub`                                                                                             | `oklch(0.865 0.007 286.3)`                                                                                                                                      | same                       | `#d2d2d7`, drawn sub bar                                                                                                                             |
| `--landing-paper-line`                                                                                            | `oklch(0.944 0.005 286.3)`                                                                                                                                      | same                       | `#ececf0`, drawn empty line                                                                                                                          |
| `--landing-paper-filled`                                                                                          | `oklch(0.831 0.007 286.2)`                                                                                                                                      | same                       | `#c7c7cc`, drawn filled line                                                                                                                         |
| `--landing-paper-avatar`                                                                                          | `oklch(0.932 0.007 286.3)`                                                                                                                                      | same                       | `#e8e8ed`, drawn avatar                                                                                                                              |

Shadows, same in both themes: `--landing-shadow-hero: 0 50px 100px rgb(0 0 0 / 0.14), 0 4px 12px rgb(0 0 0 / 0.05)` (center card, steps card) and `--landing-shadow-side: 0 30px 60px rgb(0 0 0 / 0.08), 0 2px 6px rgb(0 0 0 / 0.04)` (side cards). Font: `--font-landing: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif`.

### Contrast pairs

Text pairs need 4.5:1 unless marked. Ratios were computed from the design's hex values.

| Theme | Foreground                                      | Background                                   | Ratio          |
| ----- | ----------------------------------------------- | -------------------------------------------- | -------------- |
| Both  | `landing-fg`                                    | `landing-bg`, `landing-bg-2`                 | at least 15.46 |
| Light | `landing-fg-2`                                  | `landing-bg`, `landing-bg-2`                 | 4.91, 4.66     |
| Dark  | `landing-fg-2`                                  | `landing-bg`, `landing-bg-2`                 | 8.16, 7.39     |
| Both  | `landing-link`, `landing-eyebrow`               | `landing-bg`                                 | at least 4.91  |
| Both  | `landing-accent-fg`                             | `landing-accent`, `landing-accent-hover`     | 4.7, 5.38      |
| Both  | `landing-showcase-fg`, `landing-showcase-muted` | `landing-showcase-card`                      | 16.61, 4.99    |
| Both  | The six card label colors                       | `landing-showcase-card`                      | at least 5.13  |
| Both  | `landing-showcase-fg`                           | `landing-showcase-bg`                        | at least 18.07 |
| Both  | `landing-showcase-fg`                           | `landing-showcase-chip`                      | about 12.8     |
| Both  | `landing-paper-ink`                             | `landing-showcase-fg`                        | about 15       |
| Both  | `landing-muted`                                 | `landing-bg` (3:1, large text only)          | 3.51 light     |
| Both  | `landing-showcase-muted`                        | `landing-showcase-bg` (3:1, large text only) | at least 5.43  |

### Font files

Copy the latin and latin extended variable WOFF2 files (weights 300 to 700) from the `@fontsource-variable/space-grotesk` package once, into `public/fonts/space-grotesk-variable.woff2` and `public/fonts/space-grotesk-variable-ext.woff2`, with no runtime dependency. Add two `@font-face` rules using the repo's existing `unicode-range` split. The pack is not preloaded: `index.html` would load it on every page.

Copy the `unicode-range` values from the existing Latin and extended `@font-face` rules in `src/index.css`. No fallback font metrics are added.

### Scroll effects

`use-scroll-effects.ts` exports `useScrollEffects()`, returning `useMediaQuery('(min-width: 64rem)') && !useReducedMotion()`. Pinning classes use `lg:motion-safe:` variants, so layout stays correct before JavaScript decides. When the hook is false, no scroll value is applied.

Each pinned section calls `useScroll({ target, offset: ['start start', 'end end'] })` and derives values with `useTransform`:

| Element                     | Input       | Output               |
| --------------------------- | ----------- | -------------------- |
| Hero text opacity           | `0, 0.4545` | `1, 0`               |
| Hero stage y                | `0, 1`      | `0, -260` (px)       |
| Hero stage scale            | `0, 1`      | `1, 1.25`            |
| Side cards y                | `0, 1`      | `'0vh', '-35vh'`     |
| Center card y               | `0, 1`      | `'0vh', '-12vh'`     |
| Steps progress bar `scaleX` | `0, 1`      | `0, 1` (origin left) |
| Steps card rotate           | `0, 1`      | `4, -4` (deg)        |
| Steps card y                | `0, 1`      | `30, -30` (px)       |

Rotation of the side cards lives in the motion `rotate` style, so it does not fight `y`. Parallax on feature visuals calls `useParallax`: template side cards `yRange: -40`, template center card `yRange: -80`, dark mode circle `yRange: -50`.

**Invariant**: the page root uses `overflow-x-clip`, never `overflow-hidden`, because hidden overflow breaks `sticky`.

### Steps card behavior

`useMotionValueEvent` on progress sets `step` (0, 1, 2) and `fills`, only when the value changes. `fills = Math.floor(clamp((p - 0.3) / 0.35, 0, 1) * 7)`. The seven drawn bars are as in the design: `data-fill` 0 (the two name bars), and 1 to 6 (body lines).

- In step 0, bars 1 to 6 have width 0%. Otherwise they have the design's widths. Width transitions use the `base` duration token.
- Bars 1 to 6 use `--landing-paper-filled` when their index is at most `fills`, otherwise `--landing-paper-line`.
- The pill shows only in step 2.
- With effects off: `step = 2`, `fills = 7`, and every step is styled active with no `aria-current`.

### Copy

Existing keys used as they are: `home.hero.subtitle`, `home.hero.cta`, `home.features.noSignup`, `home.features.free`, `home.features.exportPdf`, `home.features.<card>.title` and `.desc` (`templates`, `darkMode`, `pdf`, `i18n`, `autosave`, `privacy`), `home.howItWorks.title` (the small label above the heading), `home.howItWorks.step1Title` to `step3Desc`, `home.stats.freeForever`, `home.stats.freeForeverLabel`, `home.stats.languages`, `home.stats.languagesLabel`, `home.cta.title`, `home.cta.subtitle`, `home.cta.button`.

Add or change these keys. Punctuation in the Polish column is final, subject to your review.

| Key                               | EN                                             | PL                                                          |
| --------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| `home.hero.title`                 | Build your perfect CV                          | Stwórz idealne CV                                           |
| `home.hero.titleHighlight`        | in minutes.                                    | w kilka minut.                                              |
| `home.hero.seeHow`                | See how it works                               | Zobacz, jak to działa                                       |
| `home.features.title`             | Everything you need.                           | Wszystko, czego potrzebujesz.                               |
| `home.features.subtitle`          | Professional tools to create standout resumes. | Profesjonalne narzędzia do tworzenia wyróżniających się CV. |
| `home.features.showcaseTitle`     | Built for every                                | Stworzone na każdy                                          |
| `home.features.showcaseHighlight` | step of the search.                            | etap szukania pracy.                                        |
| `home.features.pdf.visual`        | .pdf                                           | .pdf                                                        |
| `home.features.i18n.visualEn`     | EN                                             | EN                                                          |
| `home.features.i18n.visualPl`     | PL                                             | PL                                                          |
| `home.features.autosave.visual`   | Saved just now                                 | Zapisano przed chwilą                                       |
| `home.features.privacy.visual`    | 0 bytes uploaded                               | Wysłano 0 bajtów                                            |
| `home.howItWorks.subtitle`        | Three simple steps.                            | Trzy proste kroki.                                          |
| `home.howItWorks.step1Number`     | 01                                             | 01                                                          |
| `home.howItWorks.step2Number`     | 02                                             | 02                                                          |
| `home.howItWorks.step3Number`     | 03                                             | 03                                                          |
| `home.howItWorks.downloadPill`    | Download PDF                                   | Pobierz PDF                                                 |
| `home.stats.templatesLabel`       | Templates                                      | Szablony                                                    |
| `home.footer.privacy`             | Your data never leaves your browser.           | Twoje dane nigdy nie opuszczają przeglądarki.               |

The six `home.features.<card>.desc` values each gain a final period in both languages. Delete `home.hero.ctaSecondary`, `home.templateShowcase`, `home.stats.avgTime` and `home.stats.avgTimeLabel` from both locales.

**Value sourcing**:

| Action                | Value displayed             | Source                                             |
| --------------------- | --------------------------- | -------------------------------------------------- |
| Hero, footer          | Site name                   | `SEO_DEFAULTS.siteName` (not translated)           |
| Hero images           | Image per template          | `PREVIEW_IMAGES[id][normalizeLang(i18n.language)]` |
| Hero images           | Dimensions                  | `PREVIEW_WIDTH`, `PREVIEW_HEIGHT`                  |
| Stats                 | Template count              | `String(TEMPLATE_IDS.length)`                      |
| Pinned sections       | Scroll progress             | `useScroll` on the section ref                     |
| Scroll effects on/off | Width and motion preference | `useMediaQuery`, `useReducedMotion`                |
| Theme                 | Light or dark values        | The existing `.dark` class                         |
| All other text        | Strings                     | `t()` keys above and existing `home.*` keys        |

**Key invariants**: no text has a scroll linked transform; below `lg` or with reduced motion no section is pinned; a template sheet is white in both themes; hero images come only from `PREVIEW_IMAGES`.

**Data and interface surface**: none. The page reads no resume storage, adds no route, search param or storage key. Links: `/templates` (two) and `/#how` through `Link to='/' hash='how'`.

**Security model**: public page with no user data and no third party request. CSP is unchanged.

**Configuration required**: none.

**Critical test scenarios**:

- Renders every section in order with real EN strings and one `h1`, verifies **AC-1**, **AC-15**
- Both buttons link to `/templates` and the text link targets `#how`, verifies **AC-2**, **AC-9**
- Hero images match the language and change after switching to PL, verifies **AC-3**
- Stat shows the `TEMPLATE_IDS.length` value and no `5 min` text, verifies **AC-8**
- With effects off, all three steps are active and the pill is visible, verifies **AC-12**, **AC-13**
- Contrast test fails when a listed landing token is changed to a failing value, verifies **AC-10**
- A focused hero link while faded brings the hero back into view (browser check), verifies **AC-5**
- With the motion features file blocked, all content is visible (browser check), verifies **AC-14**

## Build plan

Tracer Bullet: the hero goes end to end first, through tokens, font, images, copy and tests. The old sections remain below it until each is replaced, so the page ships at every step.

1. Add all landing tokens, contrast pairs, font files and `@font-face` rules, satisfies **AC-10**, **AC-11**
2. Split sections into the file layout, set the root to `overflow-x-clip`, and build the hero with real images, pinning, fade, copy in both locales and tests, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-12**, **AC-13**, **AC-15**
3. Build the statement and features sections with visuals and parallax, satisfies **AC-1**, **AC-6**, **AC-15**
4. Build how it works with the steps card and effect off state, satisfies **AC-7**, **AC-12**, **AC-13**, **AC-15**
5. Build stats, closing section and footer, then remove the deleted keys, satisfies **AC-8**, **AC-9**, **AC-15**
6. Add the landing folder to `TOKEN_ONLY_FILES` now that no old section remains, remove dead pieces after searching for each use, and update `DESIGN.md`, satisfies **AC-10**, **AC-17**
7. Check SEO output, motion failure, phone width and performance, then run `pnpm pre-commit`, satisfies **AC-14**, **AC-16**, **AC-18**

## Consequences

**Positive**:

- The page shows real output in both languages, and the design's scrolling story survives within your rules.
- No other page changes, and no library is added.

**Negative / tradeoffs**:

- The landing page will look different from the gallery, builder and preview until those pages are refreshed or the tokens are made global.
- About 35 extra tokens and one more font pack need maintaining for one page.
- Up to about 345 KB of images on large screens, though side images load late.
- Offline, hero images may show as blank white sheets, since the PWA precache excludes WebP files.
- The page has about 500vh of pinned scrolling on large screens, so reaching the end takes longer.

**Neutral**:

- `design-source.html` is reference only and is never bundled.

## Follow-up

- [ ] At the template gallery refresh, decide whether the landing tokens become the app's global design system or stay on this page.
- [ ] Review the Polish strings in _Copy_ before merging.
