# 0011. Template gallery refresh: rationale

## Context

The gallery and detail pages are the last public pages still on the old look: raw indigo gradients, glass panels and a moving background, none of it from the spec 0004 tokens. Scope feature 13 asks for both pages on the new design system, with previews that load fast and no layout shift. Spec 0010 also left an open question to settle here: should the landing look become global?

What the code shows today:

- `templates-page.tsx` has two `h1` elements, a preview `div` with `role='link'`, and a reset that writes storage directly, against the rule that only `stored-resume.ts` does so. That reset also deleted the backup, which `clearResume` deliberately keeps.
- Cards crop the template to a square, so the bottom half of every page is hidden.
- The detail page renders `fallback={null}` while about 350 KB of PDF engine loads, then a blank `PDFViewer` frame until the PDF is rendered.
- `PDFViewer` is an iframe, and phone browsers commonly cannot draw a PDF inside one.
- Card images are 1190px wide but drawn around 340px wide.
- Saved time strings use one plural form, which is wrong in Polish for 2 to 4.

**Measured** (2026-11-09, from the committed WebP files): full size files are 107 to 126 KB. A 720px version at the same quality is 50 to 60 KB. Sample PDFs are one page, except veterinary at two pages.

Constraints: templates stay white and unchanged, the `/templates` and detail budgets are 199 and 200 KB, and the PDF engine must stay out of first load.

## Options considered

### Option 1: Rebuild in place, landing composition on spec 0004 tokens

New shared components in `src/features/gallery/`, the same routes, and the tokens the rest of the app uses.

**Pros**: matches the scope row and keeps features 14 and 15 as planned. The landing only rule holds. Small and easy to revert by slice.
**Cons**: the home page and gallery still differ in color and font.

### Option 2: Make the landing tokens global, starting here

Move the gallery to `landing-*` colors and Space Grotesk, with builder and preview to follow.

**Pros**: one look across the whole site.
**Cons**: reopens spec 0004 and its contrast suite, adds font weight to these routes, and leaves builder and preview mismatched until features 14 and 15 are redone.

### Option 3: Restyle the existing markup with tokens only

Keep the crop, hover zoom, banner and full height viewer, and only swap the classes.

**Pros**: the least work and the least risk.
**Cons**: keeps the hidden half page, the blank detail page and the fake link, so "previews that load fast" goes unmet.

### Sub decisions

| Decision         | Chosen                              | Runner up                   | Why                                                                                                                                                                                                               |
| ---------------- | ----------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Detail loading   | prebuilt image, then PDF            | skeleton                    | The image already exists, shows real content, and doubles as the failure state                                                                                                                                    |
| Phones           | image only below `lg`               | PDF everywhere              | An iframe PDF is unreliable on phones, and this saves the engine download                                                                                                                                         |
| Card image       | full sheet                          | taller crop                 | You choose a template by its whole layout                                                                                                                                                                         |
| Card size        | add 720px with `srcset`             | one size                    | Measured to halve the bytes for most screens, at the cost of six generated files                                                                                                                                  |
| Saved banner     | Continue link, reset in builder     | keep Reset                  | A destructive action does not belong on a browsing page, and the builder already has it                                                                                                                           |
| Saved time       | `Intl.RelativeTimeFormat`           | keep strings                | Correct plurals for free, and six fewer keys                                                                                                                                                                      |
| Motion           | none on cards                       | staggered fade              | The cards are the first paint, so an entrance can only delay them                                                                                                                                                 |
| Readiness signal | `BlobProvider` plus iframe `onLoad` | image behind `PDFViewer`    | `PDFViewer` exposes no ready signal, so the blank frame would cover the image                                                                                                                                     |
| Viewer code      | a separate gallery viewer           | one shared `TemplateViewer` | `/preview` shows real editor output, and a gallery need should not change it; a hidden render error there would hide real problems. One extra `lazyEngines` entry is a small price, and feature 15 can merge them |
| Paper color      | new `paper` token                   | `bg-card`                   | A template sheet is white in both themes, and `card` is dark in dark mode                                                                                                                                         |
| Shadow           | `shadow-raised`, `shadow-overlay`   | `landing-shadow-*`          | Keeps the tokens rule while still reading as paper                                                                                                                                                                |

### Cross check (2026-11-09)

A read only review on another model raised several gaps, now closed in the spec. Two of its claims did not hold when checked against the code: `usePDF` keeps the previous `url` during a re-render, so the iframe does not unmount, and the app renders only in the browser, so the saved notice is present on the first paint.

## Rationale

Option 1 is the one that meets all the forces at once: the scope row asks for the new design system, you asked for the landing pattern, and the landing tokens stay landing only. Composition carries the family resemblance, and tokens keep theme support and the contrast checks without reopening spec 0004.

The detail page choice comes from one fact: the app already ships an accurate picture of each template. Using it first removes the blank state on every device, and because it stays put on any failure, the page needs no error UI. The phone rule follows from the same reasoning, since the image is both the fast option and the option that works.

The smaller image is justified by the measurement, not by assumption. It is the one generated artifact this spec adds, and the existing `--check` guards it.
