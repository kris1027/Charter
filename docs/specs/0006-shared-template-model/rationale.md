# 0006. Shared template model: rationale

## Context

> ⚠️ Premise note: the scope says "one description … so a new section is added in one place instead of six". One place is not reachable without forcing the three templates into one shared look, and they differ on purpose (a dark code style header, a centered executive header, colored cards). The real goal is that a new section can't be forgotten anywhere. This spec gets there with three small renderers the compiler insists on, which beats six free form edits plus a parser nobody remembers. The "match today's look" criterion also needed a reference, since the HTML and PDF copies already differ. The PDF (what users download) was chosen.

Each template exists twice. The HTML copy (`src/features/templates/html/`, 215 to 262 lines each) is used only by the three gallery cards, scaled down from 794 px with a ResizeObserver. The PDF copy (`src/features/templates/pdf/`, 329 to 357 lines each) drives the preview, the detail page and the export. The two copies have drifted. In Default, the HTML header rule is black and the PDF one is blue; HTML shows no website and joins interests with •; HTML always shows the experience header, while the PDF hides it when empty. So the gallery already misrepresents what users get.

Inside the PDF copies, the same helpers are copied three times (`lerp`, `parseDescriptionLines`, the GDPR text choice, the `Document` metadata), and so are the contact items, with uneven coverage (only Developer prints GitHub). The import parser (`pdf-parser.ts`, 839 lines) holds its own copies of every section header as literals, English only. Renaming a header in a template silently breaks text import.

Constraints: templates stay white and unanimated. react-pdf must never reach the eager bundle (spec 0003 budgets: `/templates` at 222 KB, chunk cap 375 KB). The spec 0002 import rule lets `templates` import only `resume` and shared code, and lets `pdf` import `templates`. Breaking the saved shape is allowed but not needed here. Workflow is Prototype, with Tracer Bullet delivery.

## Options considered

### Option 1: Prebuilt PDF images for the gallery, plus a shared section registry with per template renderers (chosen)

Delete the HTML templates. A Node script renders each PDF with sample data and rasterizes it to WebP for the cards, guarded by an input hash check. The PDFs read a plain view model and map each section id to a renderer through a `satisfies` typed map.

**Pros**:

- Cards are pixel identical to the export, cost almost nothing to load, and have fixed dimensions.
- Three render spots, each forced by the compiler, and no second technology to keep in step.
- The same script gives a before/after pixel diff that proves the refactor.

**Cons**:

- Binary images in git, plus a regeneration step on every template change.
- A native dev dependency (`@napi-rs/canvas`) and a nontrivial script (Vite SSR, pdfjs in Node).

### Option 2: Write each template once against render primitives, with DOM and react-pdf adapters

Define `Box`, `Text` and `Link` primitives with a react-pdf style subset. One adapter maps them to DOM elements with inline styles, the other to react-pdf. Each template is written once.

**Pros**:

- Truly one file per template, and live gallery cards with no assets.
- No build step or binaries.

**Cons**:

- You own a cross renderer layer forever. Text wrapping, hyphenation (disabled in react-pdf here), `wrap={false}` and pt vs px all differ between browser and PDF layout, so the card is only approximately the export.
- Fonts must load in the gallery too, which adds weight to `/templates`.

### Option 3: Render the real PDF live in each card

Lazy load react-pdf and pdfjs in the gallery and draw page 1 to a canvas.

**Pros**:

- Exact look, nothing to regenerate.

**Cons**:

- Pulls the ~360 KB engine plus pdfjs into `/templates`, breaks its 222 KB budget, and delays every card.

### Option 4: Keep both copies, share only the data shaping

Add `buildResumeView` and have both the HTML and PDF copies read it.

**Pros**:

- The smallest change, and no tooling.

**Cons**:

- Still six render spots, and the drift between the HTML and PDF looks stays.

## Rationale

The cards exist to show what the user will get. Only the PDF is real, so anything that redraws it a second way (Options 2 and 4) reintroduces the drift this feature exists to remove. Option 3 is honest but breaks the performance budgets that spec 0003 put in CI. Prebuilt images keep the honesty and beat every option on load cost. The usual risk of generated assets (they go stale) is handled mechanically: the hash covers exactly the modules the render loaded, so there is no list to keep in sync, and pre-commit refuses stale images. Hashing inputs, not pixels, keeps the check stable across macOS and the Linux CI.

For the PDFs, a registry with per template renderers is the deepest sharing that still lets each template keep its own look. All the logic that can be wrong in a boring way (dates, present, native level, bullets, GDPR text, contact links) moves into one pure, tested function. What is left in each template is layout and styling, which really is per template. `satisfies` gives the "can't forget one" guarantee at build time, which is what actually matters to the developer. Fully shared section components were rejected because they would bend three distinct looks into one shape and fail the "match today's look" criterion.

Recommended calls made in writing: the gallery `<img>` uses static imports (hashed filenames, so the PWA cache busts on its own) over `public/` paths. The pixel diff is written in plain code rather than with `pixelmatch`, since an exact compare loop is twenty lines and adds no dependency. It requires zero changed pixels, because one machine renders deterministically and any tolerance would hide a changed word. Images are runtime cached, not precached, so users who never open the gallery don't download them.

A cross check on another model found 13 gaps, and all of them were applied. The most important one: in Polish, default and veterinary both print `ZAINTERESOWANIA`, so the old detection order (veterinary before default) would misread a Polish default export. Detection now checks default first. The Vite SSR config is inline and minimal rather than reusing `vite.config.ts`, because the PWA and React Compiler plugins have no job in a Node render. The images are 2× A4 at one size rather than a `srcset`, because the card is at most about 400 px wide and 6 files are simpler to track than 12.
