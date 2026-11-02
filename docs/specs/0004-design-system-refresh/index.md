# 0004. Design system refresh: AA checked tokens, refreshed primitives, and toast notices for the app shell

**Date**: 2026-11-02
**Status**: Accepted

## Summary

This spec turns the app's current indigo and slate look into a real design system: one set of named colors, shadows, motion timings and fonts (tokens) for light and dark mode, each checked by a test against WCAG 2.2 AA contrast. The shared UI pieces in `src/components/ui/` and the app shell in `src/app/` move onto those tokens, four new pieces arrive (badge, tooltip, segmented control, toast), and the four bottom banners (privacy, offline, install, update) become stacked toasts. Page bodies keep their current classes until their own Slice 3 refresh, and the resume templates do not change at all. Everything is written down in a root `DESIGN.md` so later slices build on it instead of guessing.

## Requirements

**User stories**:

- As a job seeker, I want text, controls and focus outlines I can actually see in both light and dark mode, so that I can use the builder comfortably and with a keyboard.
- As a job seeker, I want notices (privacy, offline, update, install) that do not pile on top of each other, so that I can read and act on each one.
- As the developer refreshing pages in Slice 3, I want a documented token and component set with a lint guard, so that each page refresh only uses the system and never invents colors.

**Acceptance criteria**:

- **AC-1**: `src/index.css` defines exactly the token set in _Token set_ below, in `:root` (light) and `.dark`, exposed to Tailwind through `@theme inline`. The `chart-*` and `sidebar-*` tokens are gone, and `color-scheme` follows the theme (`light` on `:root`, `dark` on `.dark`), so native controls and scrollbars match.
- **AC-2**: A vitest test reads the token values from `src/index.css`, converts OKLCH to sRGB, and passes only when every pair in _Contrast pairs_ clears its ratio in both themes: 4.5:1 for text pairs, 3:1 for non text pairs (input border, focus ring, brand gradient stops). Changing any listed token to a failing value makes the test fail and name the pair, theme and ratio.
- **AC-3**: Every interactive primitive (button, input, textarea, select trigger, checkbox, date picker trigger, toggle group items, tooltip trigger when it is a button, toast buttons) shows the same focus indicator on keyboard focus: a 2px solid `--ring` outline with a 2px offset. Items inside clipped menus (dropdown items, select items) show the same outline inset (`outline-offset: -2px`) plus the `bg-accent` highlight, so it is never cut off. Mouse clicks do not show it (`:focus-visible` only). No primitive keeps an `outline-none` or `outline-hidden` class that would override the rule.
- **AC-4**: The existing primitives (`alert-dialog`, `button`, `card`, `checkbox`, `date-picker`, `dropdown-menu`, `error-boundary`, `field-error`, `input`, `label`, `popover`, `select`, `textarea`) use tokens only. Button sizes stay `sm` 32px, `default` 36px, `lg` 40px, `icon` 36px, and inputs stay 36px tall. Existing tests still pass and their public props do not change.
- **AC-5**: Four new primitives exist in `src/components/ui/` each with a test file beside it: `Badge` (variants `default`, `secondary`, `outline`, `success`, `warning`, `info`, `destructive`), `Tooltip` (Radix, opens on hover and keyboard focus, closes on Escape), `SegmentedControl` (Radix ToggleGroup `type='single'`, exposed as a radio group: the chosen item is announced as checked; arrow keys move focus between items and Space or Enter selects; clicking the selected item never clears the value, because an empty value from `onValueChange` is ignored), and the toast pieces in _Toast contract_.
- **AC-6**: One `<Toaster />` is mounted in `src/app/root-layout.tsx`, at the bottom center, before the notice components in tree order, with every visible toast fully expanded (no hidden actions). The four shell notices render as toasts with these rules:
    - **Privacy**: shows on first visit while `privacyNoticeAccepted` is unset. It has no close button, cannot be swiped away, never times out, and closes only through Accept, which saves `privacyNoticeAccepted`.
    - **Offline**: a warning toast shows while `navigator.onLine` is false (also on a page load that starts offline) and is removed when the `online` event fires. No toast appears on reconnect.
    - **Update**: when a new service worker waits, a persistent toast offers Reload (activates it) and Close (hides it for this visit). When the app is ready to work offline, an info toast shows for 5 seconds.
    - **Install**: when the browser offers install and `pwaInstallDismissed` is unset, a persistent toast offers Install and Close. Install opens the browser prompt and closes the toast whatever the outcome, without saving the flag. Close saves `pwaInstallDismissed`. The `appinstalled` event also closes it.
    - Each notice uses a stable toast id and dismisses its toast only when its condition turns false (never in an effect cleanup), so a re render or StrictMode double effect never shows it twice or drops it.
- **AC-7**: Motion uses three duration tokens (`fast` 150ms, `base` 250ms, `slow` 400ms) and two easing tokens (`standard`, `exit`), defined once in CSS and mirrored in `src/lib/motion-tokens.ts`, with a test proving the two match. `src/lib/animation-variants.ts` reads the TS mirror. The unused keyframe classes (`animate-fade-in-scale`, `animate-slide-in-left`, `animate-slide-in-right`, `animate-grow-width`, `animate-shimmer`, `hover-lift`) are deleted. Under `prefers-reduced-motion: reduce`, one global rule sets `animation-duration` and `transition-duration` to `0.01ms !important` on every element and pseudo element, so the remaining keyframes, the tw-animate-css open and close classes, and toast enter and exit all stop; motion variants return `{}`.
- **AC-8**: Elevation uses three tokens (`surface`, `raised`, `overlay`) per theme, and the dark values really apply in dark mode. Card and the selected segment use `surface`; popover, dropdown, select content, tooltip, alert dialog and toasts use `overlay`. Controls (buttons, inputs, select trigger, checkbox) are flat. No primitive uses a Tailwind default shadow (`shadow-xs` to `shadow-2xl`).
- **AC-9**: A root `DESIGN.md` documents every token (light and dark value, what it is for, which pairs it is tested against), each primitive (variants, sizes, when to use it), the focus, motion and elevation rules, the brand gradient rule (decorative only), the toast API, the lint rule, and how to add a token (including adding its pairs to the contrast test).
- **AC-10**: An ESLint rule fails on raw palette color classes (for example `indigo-600`, `slate-400`, `bg-white`, `text-black`) and arbitrary color values (for example `bg-[#fff]`, `text-[oklch(0.5_0.1_250)]`) in string and template literals under `src/components/**`, `src/app/**` and `src/lib/button-variants.ts`. A fixture test proves the rule fires on a bad literal and stays quiet on token classes. Test files and everything else (pages, templates) are out of the rule for now.
- **AC-11**: Nothing outside the shell changes behavior: the three HTML templates and three PDF templates render exactly as before, every page still renders in both themes, every new user facing string exists in `src/locales/en` and `src/locales/pl`, and `pnpm pre-commit` passes (with any `perf/budgets.json` raise carrying a reason that names spec 0004).

## Decision

**Chosen option**: Option 2: evolve the current look into a tested token system, restyle the shared layer now, and let each page join in its own Slice 3 feature.

Keep the indigo and slate identity, Atkinson Hyperlegible plus Syne, and the 0.625rem radius; make solid indigo the primary color with the indigo to purple gradient as a decorative accent only; add semantic, elevation and motion tokens; prove contrast with a unit test; restyle `src/components/` and `src/app/` onto the tokens with a lint guard; and replace the shell banners with Sonner toasts rendered by our own token styled card.

**Implementation skills**: `ask-sonner` (`emilkowalski/skills`, `.agents/skills/ask-sonner/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

### Token set

All colors are OKLCH. Names in brackets are the Tailwind v4 palette entry the value comes from, for readability only; the CSS holds the raw `oklch()` value. Every color token has a Tailwind utility through `@theme inline` (`--color-<name>: var(--<name>)`).

| Token                                         | Light                                                                                              | Dark                                                                                               | Use                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `--background`                                | `oklch(1 0 0)` (white)                                                                             | `oklch(0.129 0.042 264.695)` (slate 950)                                                           | page background                                           |
| `--foreground`                                | `oklch(0.129 0.042 264.695)` (slate 950)                                                           | `oklch(0.984 0.003 247.858)` (slate 50)                                                            | body text                                                 |
| `--card`                                      | white                                                                                              | `oklch(0.208 0.042 265.755)` (slate 900)                                                           | cards, toasts                                             |
| `--card-foreground`                           | slate 950                                                                                          | slate 50                                                                                           | text on cards                                             |
| `--popover`                                   | white                                                                                              | slate 900                                                                                          | popover, dropdown, select, tooltip                        |
| `--popover-foreground`                        | slate 950                                                                                          | slate 50                                                                                           | text on those                                             |
| `--primary`                                   | `oklch(0.511 0.262 276.966)` (indigo 600)                                                          | `oklch(0.673 0.182 276.935)` (indigo 400)                                                          | main buttons, links, selected state                       |
| `--primary-foreground`                        | white                                                                                              | slate 950                                                                                          | text on primary                                           |
| `--primary-hover`                             | `oklch(0.457 0.24 277.023)` (indigo 700)                                                           | `oklch(0.785 0.115 274.713)` (indigo 300)                                                          | primary button hover (replaces `hover:bg-primary/90`)     |
| `--secondary`                                 | `oklch(0.968 0.007 247.896)` (slate 100)                                                           | `oklch(0.279 0.041 260.031)` (slate 800)                                                           | secondary buttons                                         |
| `--secondary-foreground`                      | `oklch(0.208 0.042 265.755)` (slate 900)                                                           | slate 50                                                                                           | text on secondary                                         |
| `--secondary-hover`                           | `oklch(0.929 0.013 255.508)` (slate 200)                                                           | `oklch(0.372 0.044 257.287)` (slate 700)                                                           | secondary button hover (replaces `hover:bg-secondary/80`) |
| `--muted`                                     | slate 100                                                                                          | slate 800                                                                                          | quiet backgrounds                                         |
| `--muted-foreground`                          | `oklch(0.446 0.043 257.281)` (slate 600)                                                           | `oklch(0.704 0.04 256.788)` (slate 400)                                                            | helper and secondary text                                 |
| `--accent`                                    | `oklch(0.962 0.018 272.314)` (indigo 50)                                                           | slate 800                                                                                          | hover and highlighted rows                                |
| `--accent-foreground`                         | slate 900                                                                                          | slate 50                                                                                           | text on accent                                            |
| `--destructive`                               | `oklch(0.505 0.213 27.518)` (red 700)                                                              | `oklch(0.704 0.191 22.216)` (red 400)                                                              | errors, delete                                            |
| `--destructive-foreground`                    | white                                                                                              | slate 950                                                                                          | text on destructive                                       |
| `--success`                                   | `oklch(0.508 0.118 165.612)` (emerald 700)                                                         | `oklch(0.792 0.209 151.711)` (green 400)                                                           | saved, done                                               |
| `--success-foreground`                        | white                                                                                              | slate 950                                                                                          | text on success                                           |
| `--warning`                                   | `oklch(0.555 0.163 48.998)` (amber 700)                                                            | `oklch(0.828 0.189 84.429)` (amber 400)                                                            | offline, caution                                          |
| `--warning-foreground`                        | white                                                                                              | slate 950                                                                                          | text on warning                                           |
| `--info`                                      | `oklch(0.5 0.134 242.749)` (sky 700)                                                               | `oklch(0.746 0.16 232.661)` (sky 400)                                                              | neutral notices                                           |
| `--info-foreground`                           | white                                                                                              | slate 950                                                                                          | text on info                                              |
| `--border`                                    | `oklch(0.929 0.013 255.508)` (slate 200)                                                           | `oklch(1 0 0 / 10%)`                                                                               | decorative dividers and card edges (no contrast duty)     |
| `--input`                                     | `oklch(0.554 0.046 257.417)` (slate 500)                                                           | slate 500                                                                                          | borders that identify a control (input, select, checkbox) |
| `--ring`                                      | indigo 600                                                                                         | indigo 400                                                                                         | focus outline                                             |
| `--brand-from` / `--brand-via` / `--brand-to` | indigo 600 / `oklch(0.541 0.281 293.009)` (violet 600) / `oklch(0.558 0.288 302.321)` (purple 600) | indigo 400 / `oklch(0.702 0.183 293.541)` (violet 400) / `oklch(0.714 0.203 305.504)` (purple 400) | the decorative gradient                                   |

Other tokens:

- **Radius**: `--radius: 0.625rem`, with the existing `sm`/`md`/`lg`/`xl` steps derived from it (unchanged).
- **Fonts** (in `@theme`): `--font-sans: 'Atkinson Hyperlegible', system-ui, -apple-system, sans-serif` and `--font-display: 'Syne', sans-serif`. The body `font-family` rule and the hand written `.font-display` class are removed; Tailwind's preflight and the `font-display` utility take over with the same fonts, so pages keep working. The template `@font-face` blocks stay as they are.
- **Brand gradient**: an `@utility text-gradient-brand` (gradient text clipped to the glyphs) and `@utility bg-gradient-brand`, both built from the three brand stops. Decorative only: allowed on a display heading word or brand mark at 24px and up (large text), never on body text, never as the only fill of a required control.
- **Elevation**: the values live in plain variables `--elevation-surface`, `--elevation-raised`, `--elevation-overlay`, defined in `:root` and again in `.dark`, and are mapped in `@theme inline` as `--shadow-surface: var(--elevation-surface)` (and so on), giving `shadow-surface` and friends. Tailwind writes a literal `@theme --shadow-*` value straight into the utility, so putting the values there directly would make the `.dark` override do nothing; check the built CSS once to confirm the utility reads the variable. Light, with the shadow color `oklch(0.129 0.042 264.695)` (slate 950):
    - `surface`: `0 1px 2px 0 <c / 0.06>, 0 1px 3px 0 <c / 0.10>`
    - `raised`: `0 4px 12px -2px <c / 0.12>, 0 2px 4px -2px <c / 0.08>`
    - `overlay`: `0 12px 32px -8px <c / 0.20>, 0 4px 8px -4px <c / 0.10>`
    - Dark: `surface` is `none` (cards separate by their lighter `--card` fill plus `--border`), `raised` and `overlay` use `oklch(0 0 0 / 0.4)` and `oklch(0 0 0 / 0.5)` with the same geometry.
- **Motion** (plain variables on `:root`, used as `duration-(--duration-base)`; easings in `@theme` as `--ease-standard` and `--ease-exit`, giving `ease-standard` and `ease-exit`):
    - `--duration-fast: 150ms` (hover, press, focus), `--duration-base: 250ms` (popover, tooltip, toast), `--duration-slow: 400ms` (entrance on scroll)
    - `--ease-standard: cubic-bezier(0.2, 0, 0, 1)` (enter and move), `--ease-exit: cubic-bezier(0.4, 0, 1, 1)` (leave)
    - `src/lib/motion-tokens.ts` exports the same values for `motion`: `duration = { fast: 0.15, base: 0.25, slow: 0.4 }` (seconds) and `ease = { standard: [0.2, 0, 0, 1], exit: [0.4, 0, 1, 1] }`.
    - Loop periods of decorative keyframes (`float` 6s, `float-reverse` 5s, `gradient-shift` 8s, `pulse-glow` 2.5s) are not motion tokens; they stay as they are.
    - Reduced motion: the existing per class reduce block is replaced by one global rule, `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; } }`. A near zero duration (not `none`) lets Radix still see `animationend` and unmount closed popovers cleanly.
- **Focus**: one base rule replaces `outline-ring/50`: `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }`. Primitives drop the shadcn `focus-visible:ring-[3px]` box shadow ring and every `outline-none` / `outline-hidden` class (they would beat the base rule). Menu and select items, which sit inside `overflow-hidden` content, add `focus-visible:outline-offset-[-2px]` next to their `bg-accent` highlight. The outline (not a box shadow) also survives Windows high contrast mode.
- **Fills and hover**: the `dark:bg-input/30` and `dark:hover:bg-input/50` fills on input, select, checkbox and the outline button are removed (with `--input` now solid slate 500 they would tint the control). Controls sit on `--background`. Hover on primary and secondary uses the two hover tokens; hover on outline and ghost uses `--accent`.
- **Browser theme color**: the `<meta name='theme-color'>` value set in `theme-provider.tsx` changes from `#1f2937` / `#ffffff` to `#020617` (slate 950) / `#ffffff`, matching `--background`. These hex strings are the one allowed exception to the lint rule (they are not classes, so the rule does not match them).

### Contrast pairs

The contrast test checks these pairs in both themes. Ratios below are the computed values for the chosen tokens, so you can see the margin.

| Pair (foreground on background)                                            | Needs | Light                 | Dark                    |
| -------------------------------------------------------------------------- | ----- | --------------------- | ----------------------- |
| `foreground` on `background`                                               | 4.5   | 20.2                  | 19.3                    |
| `card-foreground` on `card` (and popover)                                  | 4.5   | 20.2                  | 17.1                    |
| `primary-foreground` on `primary`                                          | 4.5   | 6.4                   | 6.5                     |
| `primary-foreground` on `primary-hover`                                    | 4.5   | 8.1                   | 10.0                    |
| `secondary-foreground` on `secondary-hover`                                | 4.5   | 14.5                  | 9.9                     |
| `primary` on `accent`, `secondary` and `muted` (selected and hover states) | 4.5   | 5.8 / 5.9 / 5.9       | 4.7                     |
| `muted-foreground` on `accent` and `secondary`                             | 4.5   | 6.8 / 6.9             | 5.6                     |
| `destructive` on `muted`                                                   | 4.5   | 5.9                   | 5.1                     |
| `primary` on `background` (links)                                          | 4.5   | 6.4                   | 6.5                     |
| `primary` on `card`                                                        | 4.5   | 6.4                   | 5.7                     |
| `secondary-foreground` on `secondary`                                      | 4.5   | 16.3                  | 14.0                    |
| `muted-foreground` on `muted`                                              | 4.5   | 6.9                   | 5.6                     |
| `muted-foreground` on `background` and on `card`                           | 4.5   | 7.6                   | 7.7 / 6.8               |
| `accent-foreground` on `accent`                                            | 4.5   | 16.0                  | 14.0                    |
| each of `destructive`, `success`, `warning`, `info` foreground on its fill | 4.5   | 6.4 / 5.4 / 5.1 / 5.9 | 7.0 / 11.4 / 11.8 / 9.2 |
| each of those fills as text on `background` and on `card`                  | 4.5   | same as above         | lowest 6.2              |
| `input` on `background` and on `card` (non text)                           | 3     | 4.8                   | 4.2 / 3.7               |
| `ring` on `background` and on `card` (non text)                            | 3     | 6.4                   | 6.5 / 5.7               |
| each brand stop on `background` (large text)                               | 3     | lowest 5.5            | lowest 6.5              |

Left out on purpose: `--border` (decorative, no contrast duty) and tinted see through fills such as the toast icon chip (`bg-<variant>/15`), which are decorative because the toast text carries the meaning. Badges use solid fills, so they are covered by the semantic pairs above. When a token is not redefined in `.dark`, the test uses its `:root` value for the dark check.

### Toast contract

- **Library**: `sonner` (new runtime dependency), rendered headless: every toast goes through `toast.custom()` with our own `ToastCard`, so Sonner keeps positioning, stacking, swipe and its live region while all visuals come from tokens. This is how the chosen "unstyled plus our tokens" style is realized, per the `ask-sonner` skill's advice that a design system toast should be headless rather than `unstyled` with overrides.
- **`src/components/ui/toast.tsx`** exports:
    - `Toaster`: wraps Sonner's `Toaster` with `position='bottom-center'`, `expand`, `visibleToasts={4}`, and `containerAriaLabel={t('toast.region')}`. No `theme` prop: the custom card is styled by tokens that already follow `.dark`. Mounted once inside `ThemeProvider` in `root-layout.tsx`, placed **before** `OfflineIndicator`, `PrivacyNotice`, `PwaInstallPrompt` and `PwaReloadPrompt`. React runs sibling effects in tree order and Sonner subscribes in a mount effect, so a Toaster placed after the notices could miss their first toasts.
    - `notify(options)`: shows a toast and returns its id. Options: `id` (string, required, so notices are idempotent), `variant` (`info` | `success` | `warning` | `destructive`), `title` (string), `description` (string, optional), `icon` (a lucide icon component, optional, defaults per variant), `actions` (up to two of `{ label, onClick, kind: 'primary' | 'secondary' }`), `duration` (ms, default 5000, `Infinity` for persistent), `dismissible` (default `true`).
    - `dismiss(id)`: removes a toast.
    - `ToastCard` (internal): `bg-card text-card-foreground border shadow-overlay rounded-lg p-4`, Sonner's default width (356px, full width under 600px). Layout: a variant colored icon chip (`bg-<variant>/15 text-<variant>`, decorative, `aria-hidden`), then `title` as `text-sm font-medium` and `description` as `text-xs text-muted-foreground`. Actions sit to the right of the text from the `sm` breakpoint up and below it on phones, as `Button size='sm'` (`primary` maps to the default variant, `secondary` to `outline`). A `dismissible` toast also gets an X icon button in the top right, labelled `t('toast.close')`, so it never depends on swipe alone. An action closes the toast after its `onClick` unless the notice dismisses it itself.
- **Notices** (`src/app/*.tsx` keep their file and component names; each renders `null`, calls `notify` from an effect when its condition becomes true, and calls `dismiss` when it becomes false; the cleanup function never dismisses, because a StrictMode show, dismiss, show of the same id can race inside Sonner and drop the toast). Texts: privacy uses `privacy.notice` as title and `privacy.details` as description; offline uses `pwa.offline` as title only; update uses `pwa.newContent` or `pwa.offlineReady` as title; install uses `pwa.install` as title, `pwa.installDescription` as description, and the new key `pwa.installButton` ("Install" / "Zainstaluj") on its button.

| Notice                           | id                  | variant | icon        | duration   | dismissible | actions                                                                                                                    |
| -------------------------------- | ------------------- | ------- | ----------- | ---------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `PrivacyNotice`                  | `privacy`           | info    | `Shield`    | `Infinity` | false       | Accept (primary): save flag, dismiss                                                                                       |
| `OfflineIndicator`               | `offline`           | warning | `WifiOff`   | `Infinity` | false       | none; dismissed on `online`                                                                                                |
| `PwaReloadPrompt` (needRefresh)  | `pwa-update`        | info    | `RefreshCw` | `Infinity` | false       | Reload (primary) · Close (secondary)                                                                                       |
| `PwaReloadPrompt` (offlineReady) | `pwa-offline-ready` | success | `RefreshCw` | 5000       | true        | none; `onAutoClose` and `onDismiss` call `setOfflineReady(false)`                                                          |
| `PwaInstallPrompt`               | `pwa-install`       | info    | `Download`  | `Infinity` | false       | Install (primary): run the prompt, dismiss, no flag · Close (secondary): save flag, dismiss; `appinstalled` also dismisses |

**Test harness**: a `renderWithToaster` helper in `src/test/test-utils.tsx` renders the subject inside `ThemeProvider` with `<Toaster />` placed before it. `src/test/setup.ts` adds a `window.matchMedia` stub (ThemeProvider and Sonner both call it) and runs `toast.dismiss()` in `afterEach`, because Sonner keeps its toast list in module state that would leak between tests. Toast assertions use `findBy*` queries, since Sonner renders on a timer. Transition behavior (reduced motion) is checked in the browser only; jsdom cannot see it.

### Component inventory

| Component                                                | State               | Change                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `button` + `button-variants`                             | existing            | tokens, new focus rule, hover tokens, no `shadow-xs`, `destructive` uses `destructive-foreground` (not `text-white`), no `dark:` color overrides left                                                                                                                                          |
| `input`, `textarea`, `select`, `checkbox`, `date-picker` | existing            | border `--input`, focus rule, no dark fill, no `shadow-xs`, `aria-invalid` uses `--destructive`                                                                                                                                                                                                |
| `label`, `field-error`                                   | existing            | tokens (`field-error` text uses `--destructive`)                                                                                                                                                                                                                                               |
| `card`                                                   | existing            | `shadow-surface`                                                                                                                                                                                                                                                                               |
| `popover`, `dropdown-menu`, `alert-dialog`               | existing            | `shadow-overlay`, motion tokens on open and close, tokens only                                                                                                                                                                                                                                 |
| `error-boundary`                                         | existing            | raw colors replaced with tokens                                                                                                                                                                                                                                                                |
| `badge`                                                  | new                 | `cva` variants, pure CSS, `span`, `text-xs font-medium rounded-md px-2 py-0.5`. `default`: `bg-primary text-primary-foreground`; `secondary`: `bg-secondary text-secondary-foreground`; `outline`: `border text-foreground`; semantic variants: solid `bg-<variant> text-<variant>-foreground` |
| `tooltip`                                                | new                 | Radix `Tooltip` from `radix-ui`; each `Tooltip` wraps its own `TooltipProvider` (`delayDuration={300}`), so nothing loads on routes that do not use one. `bg-popover text-popover-foreground border shadow-overlay text-xs`                                                                    |
| `segmented-control`                                      | new                 | Radix `ToggleGroup` `type='single'`, requires an `aria-label` prop. Track: `bg-muted rounded-lg p-1`; item: `text-muted-foreground`; selected item (`data-state='on'`): `bg-background text-foreground shadow-surface`. Sizes `sm` 32px and `default` 36px, matching buttons                   |
| `toast`                                                  | new                 | see _Toast contract_                                                                                                                                                                                                                                                                           |
| `theme-toggle`, `language-toggle`                        | existing shell      | tokens and focus rule only                                                                                                                                                                                                                                                                     |
| `geometric-shapes`, `parallax-background`                | existing decorative | raw indigo and violet replaced with the brand tokens (they live in `src/components`, so the lint rule covers them)                                                                                                                                                                             |

The new `Tooltip` and `SegmentedControl` are not wired into pages here; their first users are the preview toolbar and gallery filters in features 13 and 15.

### Lint rule

In `eslint.config.js`, a block for `src/components/**/*.{ts,tsx}`, `src/app/**/*.{ts,tsx}` and `src/lib/button-variants.ts` (ignoring `**/*.test.{ts,tsx}`) sets `no-restricted-syntax` to error on `Literal` and `TemplateElement` nodes whose value matches any of:

- `\b(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|[1-9]00|950)\b`
- `\b(bg|text|border|ring|ring-offset|outline|fill|stroke|from|via|to|shadow|divide|placeholder|caret|accent|decoration)-(white|black)\b`
- `-\[(#|oklch\(|rgb|hsl)` (arbitrary color values)

The patterns sit inside an esquery selector string in JS, so every `\b` is written `\\b` in the config source; build the selectors from a small helper so the escaping lives in one place. A fixture test (`eslint.config.test.ts`, using ESLint's `Linter` or `ESLint` API) lints a snippet with `'text-slate-500'` and `'bg-[#fff]'` (both must error) and one with `'bg-primary text-muted-foreground'` (must pass). Message: `Use a design token, not a raw palette color (spec 0004, see DESIGN.md).` Each Slice 3 feature adds its page folder to the block's `files` when it refreshes that page.

### Value sourcing

| Action             | Value produced / displayed           | Source                                                                                          |
| ------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Contrast test      | each token's OKLCH value per theme   | parsed from `src/index.css` (`:root` and `.dark` blocks)                                        |
| Contrast test      | which pairs to check and their ratio | a pair list in the test file, mirroring _Contrast pairs_                                        |
| Motion parity test | CSS durations and easings            | parsed from `src/index.css`                                                                     |
| Motion variants    | durations and easings in seconds     | `src/lib/motion-tokens.ts`                                                                      |
| `ToastCard`        | colors in each theme                 | tokens under `.dark`, set by `ThemeProvider` on `<html>`                                        |
| `Toaster`          | region label                         | new i18n key `toast.region` ("Notifications" / "Powiadomienia")                                 |
| `ToastCard`        | close button label                   | new i18n key `toast.close` ("Close notification" / "Zamknij powiadomienie")                     |
| Browser chrome     | theme color                          | constants in `theme-provider.tsx`, matching `--background` (`#ffffff` / `#020617`)              |
| Privacy toast      | title, details, button label         | existing keys `privacy.notice`, `privacy.details`, `privacy.accept`                             |
| Privacy toast      | shown or not                         | `safeStorage.getItem('privacyNoticeAccepted')`                                                  |
| Offline toast      | shown or not                         | `navigator.onLine` at mount, then `online` / `offline` window events                            |
| Offline toast      | text                                 | existing key `pwa.offline`                                                                      |
| Update toasts      | shown or not, which one              | `needRefresh` and `offlineReady` from `useRegisterSW()`                                         |
| Update toasts      | text                                 | existing keys `pwa.newContent`, `pwa.offlineReady`, `pwa.reload`, `pwa.close`                   |
| Install toast      | shown or not                         | a captured `beforeinstallprompt` event plus `safeStorage.getItem('pwaInstallDismissed')`        |
| Install toast      | text                                 | existing keys `pwa.install`, `pwa.installDescription`, `pwa.close`; new key `pwa.installButton` |
| Install toast      | closed after install                 | the `appinstalled` window event                                                                 |
| Lint rule          | which files are covered              | the `files` glob in `eslint.config.js`                                                          |

### Key invariants

- Components in `src/components/` and `src/app/` reference colors, shadows and durations only through tokens (enforced by the lint rule for colors; shadows and durations by review and `DESIGN.md`).
- Every color token that carries text or identifies a control has at least one pair in the contrast test; adding a token without a pair is a review failure called out in `DESIGN.md`.
- The CSS motion tokens and `motion-tokens.ts` hold the same values (parity test).
- Exactly one `Toaster` is mounted, before the notices; every `notify` call passes a stable `id`; no effect cleanup dismisses a toast.
- The privacy toast can only close through Accept.
- Templates never read app tokens (they do not today; nothing here changes that).

### Security model

No new data, secrets, or network calls. Toasts read and write only the existing `safeStorage` keys `privacyNoticeAccepted` and `pwaInstallDismissed`. Sonner injects a `<style>` tag at runtime; the CSP in `vercel.json` (and `vite.config.ts`) already allows `style-src 'self' 'unsafe-inline'`, so no CSP change is needed. Toast text comes from translation keys only, never from user input.

### Configuration required

None. New dependency: `sonner` (runtime).

### Critical test scenarios

- Happy path: render the root layout with no stored flags, offline, with a waiting service worker → privacy, offline and update toasts all visible and fully expanded, each with its own buttons; Accept saves the flag and removes only the privacy toast. Verifies **AC-6**.
- Contrast failure: set `--muted-foreground` in `.dark` to slate 500 in a scratch edit → the contrast test fails naming `muted-foreground on muted (dark)` with its ratio under 4.5. Verifies **AC-2**.
- Idempotency: render `PrivacyNotice` in StrictMode with the real Sonner (no mock) via `renderWithToaster` → exactly one privacy toast, found with `findBy*`. Verifies **AC-6**.
- Install: Install with a `userChoice` of `dismissed` → the toast closes and `pwaInstallDismissed` stays unset; Close → the flag is saved. Verifies **AC-6**.
- Segmented control: click the selected item → the value stays; arrow keys move focus, Space selects; the selected item has `aria-checked='true'`. Verifies **AC-5**.
- Offline flip: fire `offline` then `online` → the warning toast appears then disappears, with no second toast. Verifies **AC-6**.
- Keyboard: tab through button, input, select, checkbox and a segmented control → each shows the 2px ring; arrow keys move within the segmented control; Escape closes a tooltip. Verifies **AC-3**, **AC-5**.
- Reduced motion: unit test that motion variants return `{}` when reduced motion is on; in the browser (not jsdom), toasts and popovers appear without transition. Verifies **AC-7**.
- Lint: the fixture test passes; add `className='text-slate-500'` to a file in `src/app/` → `pnpm lint` fails with the spec 0004 message; the same class in `src/features/landing/` passes. Verifies **AC-10**.
- Templates unchanged: gallery card previews and PDF export look identical before and after (visual check). Verifies **AC-11**.

## Migration plan

**Strategy**: strangler. The new tokens replace the old ones in one place, so every page picks them up at once; pages still using raw `indigo`/`slate` classes keep rendering exactly as before until their own Slice 3 feature moves them onto tokens.
**Phases**:

1. Tokens, focus rule, button and the contrast test land together (the app looks nearly the same; primary darkens slightly to indigo 600, dark mode primary becomes indigo).
2. Remaining primitives and the shell move onto tokens; banners become toasts.
3. The lint rule switches on for `src/components` and `src/app`.
4. Features 12 to 15 each extend the lint rule's `files` to their page folder as they refresh it.

**Rollback**: each build task is one commit (or PR) that can be reverted on its own. Reverting the toast task brings the banners back unchanged.
**Risks**: pages that combine raw classes with token based primitives may look a little mismatched (for example an indigo 600 gradient next to an indigo 600 solid button) until their refresh; accepted for this pass. Sonner may push a route over its JS budget; handled by the budget raise rule from spec 0003.

## Build plan

Tracer Bullet: the first task threads one primitive through every new layer (token, contrast test, focus rule, docs), then the rest thickens it. The app ships after every task.

1. **Thread**: rewrite the token blocks in `src/index.css` (the full _Token set_: colors, `color-scheme`, fonts via `@theme`, elevation, motion variables, brand utilities, focus rule; remove `chart-*`, `sidebar-*`, the body `font-family` rule and `.font-display`), restyle `button` and `button-variants` on them (hover tokens, no `outline-none`, no `shadow-xs`), update the theme color hex in `theme-provider.tsx`, add the contrast test (`src/lib/design-tokens.test.ts`) with the full pair list, and start `DESIGN.md` with the token tables. Satisfies **AC-1**, **AC-2**, part of **AC-3**, part of **AC-9**.
2. Restyle the remaining existing primitives, `theme-toggle`, `language-toggle`, `geometric-shapes` and `parallax-background` onto tokens, the focus rule and the elevation levels; document each in `DESIGN.md`. Satisfies **AC-3**, **AC-4**, **AC-8**.
3. Add `sonner`, the `matchMedia` stub and `afterEach` dismiss in `src/test/setup.ts`, and `renderWithToaster` in `src/test/test-utils.tsx`; build `src/components/ui/toast.tsx` (`Toaster`, `notify`, `dismiss`, `ToastCard`) and mount the `Toaster` before the notices; convert `PwaReloadPrompt` first as the end to end proof, then `OfflineIndicator`, `PwaInstallPrompt` and `PrivacyNotice`; rewrite their tests against the real toast output; add `toast.region`, `toast.close` and `pwa.installButton` to EN and PL. Run `pnpm build && pnpm perf:size` and, if a route is over, raise its `maxKb` in `perf/budgets.json` with a reason naming spec 0004 and the measured size. Satisfies **AC-6**, part of **AC-11**.
4. Switch on the lint rule for `src/components/**`, `src/app/**` and `src/lib/button-variants.ts`, add its fixture test, and fix anything it flags. Satisfies **AC-10**.
5. Add `badge`, `tooltip` (its own provider per tooltip) and `segmented-control`, each with tests (render, variants, keyboard, accessible name, no empty value). Satisfies **AC-5**, part of **AC-3**.
6. Add `src/lib/motion-tokens.ts` and its parity test, point `animation-variants.ts` at it, delete the unused keyframe classes, and replace the per class reduce block with the global reduced motion rule. Satisfies **AC-7**.
7. Finish `DESIGN.md` (components, focus, motion, elevation, gradient rule, toast API, lint rule, how to add a token), then run `pnpm pre-commit` and a visual pass of every page and the three templates in both themes. Satisfies **AC-9**, **AC-11**.

## Consequences

**Positive**:

- Contrast is proven by a fast unit test instead of hoped for, in both themes, and any later token change is checked automatically.
- Slice 3 features start from a documented, guarded system, so each page refresh is mostly layout work.
- The four bottom banners no longer overlap; they stack, and each keeps its own actions.
- Dark mode gets a real brand color instead of near white buttons.

**Negative / tradeoffs**:

- A new runtime dependency (`sonner`) loads on every route, roughly 8 to 10 kB brotli against about 11 kB of headroom on `/`; a budget raise on one or more routes is likely.
- The global reduced motion rule also shortens any third party animation, which is the point, but a future component that relies on a long transition for meaning would need its own handling.
- Primary and secondary hover now need their own tokens (two more values per theme to keep in sync with their base colors).
- Until features 12 to 15 land, pages mix raw palette classes with token based primitives, so the app looks slightly inconsistent in places.
- Motion values live in two places (CSS and TS); the parity test keeps them honest but is one more thing to update.
- The input border becomes visibly darker (slate 500) to meet the 3:1 rule, a noticeable change from the soft shadcn look.
- The headless toast means we own the card markup and its tests instead of using Sonner's built in styles.

**Neutral**:

- `.font-display` moves from a hand written class to Tailwind's `font-display` utility with the same font; no page edits needed.
- `animation-variants.ts` entrance timing shortens from 0.5s to 0.4s (`slow`).
- The `ask-sonner` agent skill was installed into `.agents/skills/` (symlinked for Claude Code).

## Follow-up

- [ ] `ask-sonner` conventions are not yet in root `AGENTS.md` `## Agent skills`; toasts are mounted at the root and called from any page, so the bullet belongs at root level (for `/sync`).
- [ ] `/sync`: add `DESIGN.md` to root `AGENTS.md` (Context files) plus the "tokens only in `src/components` and `src/app`, lint enforced" rule, and update the Storage line's note that the privacy and install flags are now toast driven.
- [ ] Features 12 to 15: each extends the lint rule's `files` to its page folder and removes the raw gradients in favor of `text-gradient-brand`, `bg-gradient-brand` and `bg-primary`.
- [ ] Feature 16: run the Lighthouse accessibility sweep in dark mode too, since the contrast test covers tokens but not page level raw classes.
