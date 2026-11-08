# 0010. Landing page refresh: decision record

## Context

> ⚠️ Premise note: scope feature 12 says the page should use the new design system, but the chosen design brings its own palette and font. A page with a separate look can become a permanent split if later Slice 3 pages stay on indigo and slate. The right framing is that the landing page is the first look at a possible direction, and the decision on global tokens is made at the gallery refresh (see Follow-up in [index.md](index.md)).

The home page is one 411 line component using raw indigo and slate classes, a drawn CV mockup that is hidden on phones, and animation classes left from before spec 0004. It is the last large surface outside the token lint guard's reach, and its stat `5 min` has no data behind it.

You supplied a Claude Design file with a stronger story, built on two pinned scroll sections. As delivered, it conflicts with project rules: text moves with scroll, reveals replay, fonts come from Google, and it uses colors that fail AA in several places. Standalone Claude Design closes by December 14, 2026, so the source must be kept in the repo.

The page has a first load JS budget (spec 0003), must load motion through `LazyMotion` with a failure fallback (spec 0008), and must keep its SEO metadata. Polish copy must exist for every string.

## Options considered

### Option 1: Fix in place

Restyle the current sections onto tokens and add the new visuals to the existing file.

**Pros**: smallest diff; lowest risk.

**Cons**: cannot deliver the pinned structure without rewriting each section anyway; leaves one very large file.

### Option 2: Replace directly, section by section

Split the page into section files and rebuild each from the design, with the hero going end to end first.

**Pros**: delivers the design; the page stays shippable after each step; one small, reviewable section at a time.

**Cons**: for a while the page mixes new and old styling on development branches; every string needs PL review.

### Option 3: Build beside the old page behind a flag

Create a parallel page and switch with a feature flag.

**Pros**: instant rollback.

**Cons**: adds a flag system to a client only app with no backend, for a page that one git revert restores.

## Rationale

The page has no data, no users' state and no API, so the strangler pattern and flags buy little here: reverting one PR is a complete rollback. Option 1 cannot reach the design, since pinning changes each section's structure. Option 2 matches the Tracer Bullet approach, with the hero proving tokens, font, images and copy together before the rest is built.

Other decisions, with the runner up for each:

- **Landing only tokens** over mapping to indigo: you wanted this look, and the tokens stay within the contrast test and lint guard. Runner up: map to `DESIGN.md`.
- **Tokens in `:root` and `.dark` with a `landing` prefix** over a scoped `.landing` class: the existing contrast test reads those blocks, and all tokens stay in one place. Runner up: a scoped class, which needs test parser changes.
- **Self hosted variable font** over Syne: the look depends on it, and the CSP and privacy message stay intact. Runner up: existing fonts.
- **No font preload** over a route head preload: `index.html` would burden every page, and `font-display: swap` keeps text visible. Runner up: a route head link if Lighthouse needs it.
- **`useScroll` plus CSS `sticky`** over the design's listener: it fits the existing hooks and keeps layout working without the engine. Runner up: port the listener. CSS scroll driven animations were also rejected, because uneven browser support would give some visitors a plainer page.
- **Opacity only hero fade** over a static headline: without a fade, the rising cards would collide with the text. It does not move text, so it stays within the parallax rule. Runner up: lay out cards so they never reach the text.
- **Inactive steps by color, not opacity**: 0.2 opacity makes real instructions unreadable. Runner up: a higher opacity, which still fails AA for the descriptions.
- **Center image is `default`**: it suits the widest audience, while `developer` and `veterinary` show range at the sides.
- **Focus returns the hero to its start**: a keyboard user tabbing back into faded text would otherwise have an invisible focus.
- **Keep `blue` card in the feature visual**: it is an abstract accent, not a representation of a template.
