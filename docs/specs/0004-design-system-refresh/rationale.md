# 0004. Design system refresh: rationale

Decision record for [index.md](index.md). `/develop` builds from `index.md` and skips this file.

## Context

The app shell runs on the stock shadcn slate tokens in `src/index.css`, but most of the UI does not use them. About 20 page and shell files paint directly with raw Tailwind palette classes: indigo to violet to purple gradients on headings and main buttons, `slate` grays for text and borders, and `red`, `amber`, `emerald` and `blue` for status. The tokens and the real look have drifted apart, so there is no single place to change a color, and nothing checks that the colors in use meet contrast rules.

Scope constraints for this pass: the refreshed UI must meet WCAG 2.2 AA (normal text 4.5:1, large text and control boundaries 3:1, a visible focus indicator) and hold Lighthouse 95+ in every category, in light and dark mode. Per route JS budgets from spec 0003 are enforced in CI with about 5% headroom. The resume templates (HTML card previews and PDF output) are out of scope and must not change. Every user facing string goes through i18n in EN and PL.

Several concrete gaps exist today. The focus ring is a 3px box shadow at 50% opacity of a light slate, which does not reliably clear 3:1. Input borders use the same light slate as decorative dividers, so text fields barely show their edges. Dark mode primary buttons are near white, so the brand disappears there. The four shell notices (privacy, offline, PWA update, PWA install) are each a `fixed bottom-0` banner and draw on top of each other when more than one is active. The keyframe library has grown classes nothing uses.

Four Slice 3 features (landing, gallery, builder, preview) will rebuild each page on "the new design system". If this decision is not made first, each of those features invents its own colors and components, and the drift gets worse with every slice.

## Options considered

### Option 1: Fix in place (touch up the shadcn tokens only)

Keep the stock token set, darken `--ring` and `--input` until they pass, and leave everything else (raw gradients, banners, keyframes) alone. Document the existing tokens.

**Pros**:

- Smallest change; nearly no visual risk.
- No new dependency, no budget pressure.

**Cons**:

- The real visual language (indigo, gradients, status colors) stays outside the tokens, so Slice 3 still has nothing to build on.
- No status tokens, so pages keep hardcoding red, amber and green.
- The overlapping banners and the near white dark mode primary stay.

### Option 2: Evolve the current look into a tested token system (chosen)

Lift the existing identity (indigo and slate, Atkinson Hyperlegible plus Syne, 0.625rem radius) into a complete token set with semantic, elevation and motion tokens, prove every pair with a contrast unit test, restyle the shared primitives and shell, add the few components Slice 3 needs, convert the banners to toasts, and guard the shared layer with a lint rule. Pages migrate in their own features.

**Pros**:

- Users see continuity, not a rebrand; the risk is in structure, not taste.
- Contrast is verified by math in CI, independent of which page Lighthouse happens to audit.
- Slice 3 features get a stable, documented base, and the lint rule keeps the shared layer clean.
- Each step ships on its own (strangler style), matching the Tracer Bullet approach.

**Cons**:

- Pages look slightly mixed until their refresh lands.
- Adds a toast dependency and its bundle cost.
- More upfront work than Option 1.

### Option 3: New visual direction

Design a fresh palette, type pairing and shape language, then rebuild tokens and components around it.

**Pros**:

- Chance to modernize the brand fully.

**Cons**:

- A taste decision with no design source on hand; the engineer chose to evolve the current UI instead.
- Larger visual jolt while pages are only partly migrated.
- New fonts would cost bytes against the budgets.

### Option 4: Sweep every raw color now

Option 2 plus replacing every raw palette class in all pages in this feature.

**Pros**:

- The app is consistent the day this lands; Slice 3 is pure layout.

**Cons**:

- Touches every page twice (colors now, layout later), which roughly doubles the churn and review load.
- One very large change against the Tracer Bullet approach.

## Rationale

Option 2 fits the forces best. The constraint is AA plus Lighthouse 95 in both themes, and the biggest risk is drift, not taste: the brand already works, it just lives outside the tokens. Moving it into tokens, with a unit test that converts OKLCH to sRGB and checks every pair, turns "meets AA" from a hope into a check that runs in milliseconds and covers dark mode, which Lighthouse by default does not. Option 1 leaves the drift in place; Option 3 spends effort on a rebrand nobody asked for; Option 4 does the page work twice.

A few calls inside the option deserve their reasons. Solid indigo as primary (with the gradient kept decorative and limited to large text) is what makes white on primary and primary as link text clear AA with margin; a gradient fill would have to pass at its lightest stop and complicates hover and disabled states. The input border moves to slate 500 because WCAG 1.4.11 asks control boundaries for 3:1, while decorative `--border` stays light. The focus indicator is a real outline rather than a box shadow, so it also survives forced colors mode. Semantic tokens are ink colors that pass as text on the background and as fills under their own foreground, so one token serves both the field error text and the warning toast.

Sonner was the engineer's pick for toasts over Radix Toast, which was the recommended reuse of the existing `radix-ui` package. Sonner works and is well maintained, and its stacking, swipe and live region are better out of the box. The cost to accept consciously: about 8 to 10 kB brotli on every route (Radix Toast would have added less, since `radix-ui` is already loaded), and possibly a budget raise. To keep the visuals inside the system, toasts render headless through `toast.custom()` with our own card, which the `ask-sonner` skill recommends for design system toasts. Converting the privacy notice to a toast was also the engineer's call; it works because the toast is persistent, not dismissible, and closes only through Accept, preserving today's consent rule.

Motion lives in two places because `motion` needs numbers in seconds while CSS needs variables; a parity test is cheaper than a build step that generates one from the other. Raw colors are guarded by the built in `no-restricted-syntax` rule rather than a Tailwind plugin, since the regex covers the cases that matter (class strings in `cn()` and `className`) with no new dependency.

### Cross check outcome

A same model cross check found four correctness bugs (Toaster mounted after the notices, dismiss in effect cleanup racing in StrictMode, `@theme` shadows ignoring `.dark`, transitions untestable in jsdom) and 13 open decisions. All recommended fixes were applied on the engineer's pick: focus outline conflicts, a global reduced motion rule, lint scope and regex, segmented control semantics, a toast test harness, hover tokens, flat controls, badge and segmented control visuals, toast card details, install flag rules, extra contrast pairs, and a provider per tooltip.

### Recommendations made while writing (engineer did not weigh in)

- **Exact OKLCH values**: picked from the Tailwind v4 palette steps the app already uses, then checked with the same conversion the test will run (ratios in `index.md`). Runner up: hand tuned tinted values, more cohesive but harder to maintain.
- **Headless `toast.custom()`** over Sonner's `unstyled` mode: full control of markup for the same effort. Runner up: `unstyled` plus `classNames`.
- **`expand` with `visibleToasts={4}`**: up to four persistent notices can coexist, and a collapsed stack would hide their buttons. Runner up: default collapsed stack with the Alt+T hotkey.
- **Update and install toasts not swipeable**: so the only ways out are the buttons, which keeps the stored flags consistent. Runner up: swipe wired to the Close handler.
- **Elevation values and dark mode `surface: none`**: dark surfaces separate by lightness, which reads better than black shadows on near black. Runner up: one shadow scale for both themes.
- **Easing curves** `cubic-bezier(0.2, 0, 0, 1)` and `cubic-bezier(0.4, 0, 1, 1)`: a common standard and exit pair. Runner up: Tailwind's `ease-out` and `ease-in`.
- **A provider per `Tooltip`** with a 300ms delay (changed after the cross check): nothing uses tooltips this pass, and a root provider would add Radix tooltip code to every route against tight budgets. Runner up: one root provider.
- **Lint scope covers `geometric-shapes` and `parallax-background`**: they sit in `src/components`, so they move to brand tokens now rather than carve an exception.

## Evidence

### Raw palette use before this change (outside templates)

Most frequent classes: `text-slate-400` (22), `from-indigo-600` (17), `to-violet-600` (14), `text-slate-500` (13), then `to-violet-700`, `to-violet-50`, `from-indigo-700`, `from-indigo-500`, `from-indigo-50` (11 each). Files: `src/components/parallax-background.tsx`, `src/components/geometric-shapes.tsx`, `src/components/ui/error-boundary.tsx`, `src/components/ui/alert-dialog.tsx`, `src/components/ui/dropdown-menu.tsx`, the four `src/app` notices, `src/features/landing/landing-page.tsx`, the three gallery pages, `src/features/preview/preview-page.tsx`, `src/features/builder/builder-page.tsx` and eight builder form sections.

### Keyframe class use

Used by pages: `animate-fade-in-up`, `animate-blur-in`, `animate-float`, `animate-float-reverse`, `animate-pulse-glow`, `animate-draw-line`, `animate-gradient-shift`, `delay-1` to `delay-8`. Unused (deleted by AC-7): `animate-fade-in-scale`, `animate-slide-in-left`, `animate-slide-in-right`, `animate-grow-width`, `animate-shimmer`, `hover-lift`.

### Templates and tokens

No file in `src/features/templates/html/` or `src/features/gallery/template-card-preview.tsx` uses a theme token class, so changing token values cannot change a template.
