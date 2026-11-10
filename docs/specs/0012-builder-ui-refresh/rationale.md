# 0012. Builder UI refresh: rationale

## Context

Scope feature 14 asks for the form, section cards, drag handles and dialogs on the new design system, with errors still shown only after touch and a builder that works fully by keyboard. The scope also sets WCAG 2.2 AA and Lighthouse 95 or better as targets for refreshed pages.

Specs 0005 and 0009 fixed the structure and the speed of the builder, but not its look. The page still has what the gallery and landing removed: a parallax background, glass blur, a different gradient per section, with raw colors, gradients or blur in 24 files. It is the last large area outside the lint guard that spec 0004 set up.

Reading the code showed problems beyond color:

- The toolbar puts about ten controls in one row, with no plan for narrow screens.
- The root `overflow-hidden` makes the page root a scroll container, which stops `sticky` from following the window.
- Preview CV is disabled until the form is valid and 30% filled, with no explanation, and a disabled button cannot take keyboard focus.
- Input errors are shown only by color classes, with no `aria-invalid`.
- The chip remove button appears only on hover, so touch and keyboard users cannot see it.
- Removing a list item loses keyboard focus.
- Drag announcements come from the library in English, inside a bilingual app.
- Reordering only works by dragging, which falls short of the WCAG 2.2 rule on dragging movements.
- GDPR company name can fail validation with no message shown.

The constraints come from earlier work. The form logic, the per card redraw rule from spec 0009, the shape of saved data and the PDFs must not move. The builder has a JS budget, and the project's rule is that no builder file passes 250 lines.

## Options considered

### Option 1: Refresh in place, with a section strip

Keep one long form, restyle on tokens, add a single strip for navigation and progress, reorganize the toolbar, and fix keyboard and non drag use.

**Pros**:

- Form logic and tests stay almost entirely intact.
- Makes a long form easy to move around, for a small amount of new code.
- One strip works at every width and never competes with the live preview for columns.

**Cons**:

- More work than a restyle, and it adds focus handling that needs tests.
- The strip uses vertical space from `md` up.

### Option 2: Restyle only

Swap classes for tokens and change nothing about layout or behavior.

**Pros**:

- Smallest and safest diff.

**Cons**:

- Leaves the phone toolbar broken and keyboard gaps open, so the feature's done when is not met.
- Moving around a long resume stays slow.

### Option 3: Collapsible sections

Fold each section so the page is short.

**Pros**:

- A short overview page.

**Cons**:

- Hidden fields can hold errors, so collapsed sections need open on error logic.
- Fields have to stay mounted for validation and for the form's array behavior, so little is saved.

### Option 4: Step by step wizard

One section per screen with next and back.

**Pros**:

- Very focused on small screens.

**Cons**:

- Hides the whole resume while people edit it, which is the opposite of a live preview.
- Reworks navigation, validation timing and most builder tests. That is a redesign of the flow, not a refresh.

## Rationale

Option 1 meets the feature's done when, which a restyle cannot, without paying for a new flow. Resume writers revisit sections constantly as they tailor a resume, so a whole page with quick jumps fits the job better than folding or stepping. Those also fight the live preview, which works best when the form is one continuous thing.

A strip was chosen over a left rail because the live preview takes half the page from 1280px up. A rail there means three squeezed columns or a second layout, while a strip is one component with one behavior. On phones it scrolls away, because the on screen keyboard leaves very little room for a second pinned bar.

Progress joins the strip rather than keeping its own card, since a section list is the natural place to show what is done. The checks use the same logic as the percent, so the two can never disagree.

Dropping motion and the background follows spec 0011's reasoning: a form is a work tool that people stare at for a long time, and this also takes repaint cost out of typing. Solid icon chips replace the rainbow because the success, info and warning tokens already mean status in this app, so a green section icon would read as done.

Preview CV stays clickable because that is the only option that both reaches keyboard users and fits a sticky toolbar: there is no room there for an explanation. Removing the 30% rule loses nothing, because the schema already requires the three fields that made up that 30%.

Move buttons on cards and a menu on chips meet the WCAG rule without making a chip a row of tiny controls. Chips lose their one tap remove, which is an acceptable price for a remove that touch and keyboard users can actually reach.

Runner ups for the smaller calls made at write time:

- **Heading levels** are `h1` then `h2` then `h3`, instead of today's `h1` then `h3` then `h4`. Runner up: keep the levels and style them, which leaves a skip.
- **Add buttons are outline**, since `DESIGN.md` keeps the default variant for the one main action. Runner up: secondary, which is quieter but looks disabled next to fields.
- **Sticky clearance uses `scroll-padding` scoped by `:has()`**, which covers focus and scrolling with one rule. Runner up: `scroll-margin` on every field, which is easy to forget.
- **Section links do not change the URL**, because a hash adds nothing useful here and touches the router for no gain. Runner up: real hash links, which allow deep links nobody needs.
- **The floating Preview is `secondary`**, so Preview CV stays the only default button in view. Runner up: default, which puts two equally strong buttons on a phone.
- **Focus timing uses one animation frame** instead of `flushSync`, because it needs no change to how TanStack Form updates. Runner up: `flushSync`, which is tighter and more invasive.
- **The active section comes from a scroll handler** reading section tops against the page's own `scroll-padding-top`, so phones and wider screens use the right offset with no second number. Runner up: `IntersectionObserver`, which needs a hardcoded band and leaves gaps for short last sections.
- **Filled stays untrimmed**, matching the current percent. Runner up: trimming, which would change the percent people see for no real gain.
