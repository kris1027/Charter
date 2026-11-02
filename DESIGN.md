# Design system

The visual language of the app shell: colors, elevation, motion, fonts, focus and the shared components in `src/components/ui/`. Decided in [spec 0004](docs/specs/0004-design-system-refresh/index.md). The resume templates are not part of it: they stay white, never animate, and never read these tokens.

Where it lives:

- Tokens: `src/index.css` (`:root` for light, `.dark` for dark, exposed to Tailwind through `@theme` and `@theme inline`)
- Motion mirror for `motion`: `src/lib/motion-tokens.ts`
- Contrast test: `src/lib/design-tokens.test.ts`
- Motion parity test: `src/lib/motion-tokens.test.ts`
- Lint guard: the `tokenOnly` block in `eslint.config.js`

## Color tokens

All values are OKLCH. The Tailwind palette name in brackets is for reading only; the CSS holds the raw value. Every token has a utility (`bg-primary`, `text-muted-foreground`, `border-input`, and so on). Opacity modifiers work too (`bg-info/15`).

| Token                       | Light                                | Dark                                 | Use                                                                    | Tested against (4.5 text, 3 non text)                           |
| --------------------------- | ------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `background`                | white                                | slate 950                            | page background                                                        | background of most pairs                                        |
| `foreground`                | slate 950                            | slate 50                             | body text                                                              | on `background`                                                 |
| `card`                      | white                                | slate 900                            | cards, toasts                                                          | background of card pairs                                        |
| `card-foreground`           | slate 950                            | slate 50                             | text on cards                                                          | on `card`                                                       |
| `popover`                   | white                                | slate 900                            | popover, dropdown, select, tooltip, dialog                             | background of popover pair                                      |
| `popover-foreground`        | slate 950                            | slate 50                             | text on those                                                          | on `popover`                                                    |
| `primary`                   | indigo 600                           | indigo 400                           | main buttons, links, selected state                                    | as text on `accent`, `secondary`, `muted`, `background`, `card` |
| `primary-foreground`        | white                                | slate 950                            | text on primary                                                        | on `primary`, `primary-hover`                                   |
| `primary-hover`             | indigo 700                           | indigo 300                           | primary button hover                                                   | under `primary-foreground`                                      |
| `secondary`                 | slate 100                            | slate 800                            | secondary buttons                                                      | under `secondary-foreground`, `primary`, `muted-foreground`     |
| `secondary-foreground`      | slate 900                            | slate 50                             | text on secondary                                                      | on `secondary`, `secondary-hover`                               |
| `secondary-hover`           | slate 200                            | slate 700                            | secondary button hover                                                 | under `secondary-foreground`                                    |
| `muted`                     | slate 100                            | slate 800                            | quiet backgrounds, segmented control track                             | under `muted-foreground`, `primary`, `destructive`              |
| `muted-foreground`          | slate 600                            | slate 400                            | helper and secondary text                                              | on `muted`, `accent`, `secondary`, `background`, `card`         |
| `accent`                    | indigo 50                            | slate 800                            | hover and highlighted rows                                             | under `accent-foreground`, `primary`, `muted-foreground`        |
| `accent-foreground`         | slate 900                            | slate 50                             | text on accent                                                         | on `accent`                                                     |
| `destructive`               | red 700                              | red 400                              | errors, delete                                                         | on `muted`, `background`, `card`; under its foreground          |
| `destructive-foreground`    | white                                | slate 950                            | text on destructive                                                    | on `destructive`                                                |
| `success`                   | emerald 700                          | green 400                            | saved, done                                                            | on `background`, `card`; under its foreground                   |
| `success-foreground`        | white                                | slate 950                            | text on success                                                        | on `success`                                                    |
| `warning`                   | amber 700                            | amber 400                            | offline, caution                                                       | on `background`, `card`; under its foreground                   |
| `warning-foreground`        | white                                | slate 950                            | text on warning                                                        | on `warning`                                                    |
| `info`                      | sky 700                              | sky 400                              | neutral notices                                                        | on `background`, `card`; under its foreground                   |
| `info-foreground`           | white                                | slate 950                            | text on info                                                           | on `info`                                                       |
| `border`                    | slate 200                            | white at 10%                         | decorative dividers and card edges                                     | none (decorative, no contrast duty)                             |
| `input`                     | slate 500                            | slate 500                            | borders that identify a control (input, select, checkbox, date picker) | on `background`, `card` (3:1)                                   |
| `ring`                      | indigo 600                           | indigo 400                           | focus outline                                                          | on `background`, `card` (3:1)                                   |
| `brand-from` / `via` / `to` | indigo 600 / violet 600 / purple 600 | indigo 400 / violet 400 / purple 400 | the decorative gradient                                                | each on `background` (3:1, large text only)                     |

Not tested on purpose: `border` (decorative) and see through tints such as the toast icon chip (`bg-info/15`), because the text next to them carries the meaning. When a token is not redefined in `.dark`, the test uses its light value for the dark check.

Other tokens:

- **Radius**: `--radius: 0.625rem`, with `rounded-sm`, `rounded-md`, `rounded-lg` and `rounded-xl` derived from it.
- **Fonts**: `font-sans` is Atkinson Hyperlegible (the default for everything), `font-display` is Syne (headings). Both live in `@theme`.
- **Browser theme color**: `theme-provider.tsx` sets `<meta name='theme-color'>` to `#ffffff` in light and `#020617` (slate 950) in dark, matching `background`.
- **`color-scheme`**: `light` on `:root`, `dark` on `.dark`, so native controls and scrollbars follow the theme.

## Brand gradient

Two utilities built from the three brand stops: `text-gradient-brand` (gradient text clipped to the glyphs) and `bg-gradient-brand`.

The gradient is decorative only. You may use it on a display heading word or the brand mark at 24px and up. Never use it on body text, and never as the only fill of a control someone has to use (a main button is solid `bg-primary`).

## Elevation

Three levels, each a token with a light and a dark value, used as `shadow-surface`, `shadow-raised` and `shadow-overlay`.

| Level     | Light                        | Dark                                                           | Used by                                                          |
| --------- | ---------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| `surface` | soft 1px to 3px slate shadow | none (cards separate by the lighter `card` fill plus `border`) | card, the selected segment, error fallback                       |
| `raised`  | 4px to 12px slate shadow     | the same shape in black at 40%                                 | anything lifted on hover (no primitive uses it yet)              |
| `overlay` | 12px to 32px slate shadow    | the same shape in black at 50%                                 | popover, dropdown, select content, tooltip, alert dialog, toasts |

Controls (buttons, inputs, select trigger, checkbox) are flat. Do not use Tailwind's default shadows (`shadow-xs` to `shadow-2xl`) in `src/components` or `src/app`.

How it works: the values live in plain variables `--elevation-*` (redefined in `.dark`), and `@theme inline` maps `--shadow-surface: var(--elevation-surface)`. A literal value inside `@theme` would be written straight into the utility, and the dark override would do nothing.

## Focus

One rule in `@layer base` covers every control:

```css
:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
}
```

- It shows on keyboard focus only, never on a mouse click.
- Never add `outline-none` or `outline-hidden` to a primitive: a utility beats the base rule and hides the ring.
- Items inside clipped menus (dropdown items, select items) add `focus-visible:outline-offset-[-2px]` next to their `bg-accent` highlight, so the ring sits inside and is never cut off.
- An outline (not a box shadow ring) also survives Windows high contrast mode.

## Motion

| Token             | CSS                          | `motion-tokens.ts` | Use                     |
| ----------------- | ---------------------------- | ------------------ | ----------------------- |
| `--duration-fast` | `150ms`                      | `duration.fast`    | hover, press, focus     |
| `--duration-base` | `250ms`                      | `duration.base`    | popover, tooltip, toast |
| `--duration-slow` | `400ms`                      | `duration.slow`    | entrance on scroll      |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | `ease.standard`    | enter and move          |
| `--ease-exit`     | `cubic-bezier(0.4, 0, 1, 1)` | `ease.exit`        | leave                   |

- In classes: `duration-(--duration-fast)`, `ease-standard`, `data-[state=closed]:ease-exit`. These also drive the tw-animate-css `animate-in` and `animate-out` classes.
- In `motion` code: import from `@/lib/motion-tokens` (as `src/lib/animation-variants.ts` does). The parity test fails if the CSS and TS values drift apart, so change both together.
- Loop periods of decorative keyframes (`float` 6s, `float-reverse` 5s, `gradient-shift` 8s, `pulse-glow` 2.5s) are not tokens.
- **Reduced motion**: one global rule under `prefers-reduced-motion: reduce` sets `animation-duration` and `transition-duration` to `0.01ms !important` on every element and pseudo element. It is near zero rather than `none`, so Radix still sees `animationend` and unmounts closed popovers. Motion variants return `{}` when reduced motion is on.
- Parallax only on decorative layers, never text; `viewport: { once: true }` on every `whileInView` (see `AGENTS.md`).

## Components

All in `src/components/ui/`. They use tokens only, so they follow dark mode on their own.

| Component                      | Variants and sizes                                                                                                         | When to use it                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                       | `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`; sizes `sm` 32px, `default` 36px, `lg` 40px, `icon` 36px | `default` for the one main action, `outline` or `secondary` next to it, `ghost` for toolbars and icon buttons, `destructive` to delete |
| `Input`, `Textarea`            | 36px tall input; `aria-invalid` turns the border `destructive`                                                             | every text field; pair with `Label` and `FieldError`                                                                                   |
| `Select`                       | trigger sizes `sm` 32px and `default` 36px                                                                                 | picking one of many options                                                                                                            |
| `Checkbox`                     | one size                                                                                                                   | on or off choices                                                                                                                      |
| `DatePicker`                   | month and year, or `yearOnly`                                                                                              | resume dates                                                                                                                           |
| `Label`, `FieldError`          | `FieldError` text uses `destructive` and shows only after `isTouched`                                                      | under every validated field                                                                                                            |
| `Card`                         | `shadow-surface`                                                                                                           | grouping a block of content                                                                                                            |
| `Popover`, `DropdownMenu`      | `shadow-overlay`, motion tokens on open and close                                                                          | menus and small floating panels                                                                                                        |
| `AlertDialog`                  | `shadow-overlay`; the scrim is `bg-background/80` with a blur, so it follows the theme                                     | confirming a destructive or lossy action                                                                                               |
| `ErrorBoundary`                | card styled fallback with a `destructive` icon chip                                                                        | wraps the routed page                                                                                                                  |
| `Badge`                        | `default`, `secondary`, `outline`, `success`, `warning`, `info`, `destructive`; `text-xs`, solid fills                     | short status or category labels                                                                                                        |
| `Tooltip`                      | `Tooltip`, `TooltipTrigger`, `TooltipContent`; each `Tooltip` carries its own provider (300ms delay)                       | a short hint for an icon button; opens on hover and keyboard focus, closes on Escape; never hide required information in it            |
| `SegmentedControl`             | `SegmentedControl` (requires `aria-label`) plus `SegmentedControlItem`; sizes `sm` 32px and `default` 36px                 | switching between two to four views; a radio group, arrows move focus, Space or Enter selects, clicking the selected item keeps it     |
| `Toaster`, `notify`, `dismiss` | variants `info`, `success`, `warning`, `destructive`                                                                       | short notices; see below                                                                                                               |

Shell pieces in `src/components/`: `ThemeToggle` and `LanguageToggle` (outline icon buttons with a dropdown), and the decorative `GeometricShapes` and `ParallaxBackground`, which use the brand tokens.

## Toasts

Sonner renders the stack, positioning, swipe and the live region; every toast's look is our own `ToastCard`, built from tokens (headless, through `toast.custom()`).

- **`<Toaster />`**: mounted exactly once in `src/app/root-layout.tsx`, at the bottom center, every toast expanded, up to four visible, region labelled `toast.region`. It sits before the notice components, because sibling effects run in tree order and Sonner must subscribe first. Never mount a second one.
- **`notify(options)`** returns the toast id. Options:
    - `id` (string, required): calling again with the same id updates the toast instead of adding one
    - `variant`: `info`, `success`, `warning` or `destructive` (sets the icon chip color and default icon)
    - `title`, and optional `description`
    - `icon`: a lucide icon component, optional
    - `actions`: up to two `{ label, onClick, kind: 'primary' | 'secondary' }`; an action closes the toast once its `onClick` settles, whatever the outcome
    - `duration`: ms, default 5000, `Infinity` to persist
    - `dismissible`: default `true`; a dismissible toast gets a close button labelled `toast.close`, so it never depends on swipe alone
    - `onAutoClose`, `onDismiss`: callbacks for timing out and for any other close (close button, swipe, action or `dismiss(id)`); each fires once
- **`dismiss(id)`** removes a toast.
- **Rules for a notice**: render `null`, call `notify` from an effect when its condition turns true, and `dismiss` when it turns false. Never dismiss in an effect cleanup (StrictMode would show, dismiss and show the same id). Text comes from translation keys only.
- **Testing**: render with `renderWithToaster` from `@/test/test-utils` and assert with `findBy*` queries (Sonner renders on a timer). `src/test/setup.ts` clears every toast after each test.

The four shell notices (`src/app/`) are toasts: privacy (Accept only, no close, no timeout), offline (warning while offline), update (Reload and Close, plus a 5 second offline ready toast) and install (Install and Close).

## Lint rule

In `src/components/**`, `src/app/**` and `src/lib/button-variants.ts` (test files excluded), ESLint fails on:

- raw palette classes such as `indigo-600` or `slate-400`
- `white` or `black` color classes such as `bg-white` or `text-black`
- arbitrary color values such as `bg-[#fff]` or `text-[oklch(0.5_0.1_250)]`

The message is `Use a design token, not a raw palette color (spec 0004, see DESIGN.md).` Shadows and durations are not linted; keep them on tokens by review. Each Slice 3 page refresh adds its folder to `TOKEN_ONLY_FILES` in `eslint.config.js`. `eslint.config.test.ts` proves the rule fires and stays quiet on token classes.

## Adding a token

1. Add the variable to `:root` in `src/index.css`, and to `.dark` if its dark value differs.
2. Expose it in `@theme inline` (`--color-<name>: var(--<name>)`) so it gets a utility.
3. If it carries text or identifies a control, add its pairs to `PAIRS` in `src/lib/design-tokens.test.ts` (4.5 for text, 3 for non text), then run `pnpm vitest run src/lib/design-tokens.test.ts`. A token without a pair fails review.
4. Add a row to the color table above.
5. For a motion token, add it to both `src/index.css` and `src/lib/motion-tokens.ts`; the parity test checks them.
