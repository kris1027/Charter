# 0007. PDF import parser: rationale

## Context

> ⚠️ Premise note: the scope row frames this as a split for maintainability, with "still imports correctly" as the bar. But every PDF this app exports carries its full data as embedded metadata, so exports already import exactly without the text parser. The text parser only matters when that metadata is gone (printed to a new PDF, run through an editor), and for that case today's parser was never tested against real output. Reading the templates shows it cannot be correct for most of them: only `developer` prints the `Company | Position` shape its single experience reader expects. A pure split would carefully preserve broken behavior. The engineer chose to restructure and fix it against real renders, which is the right framing.

The import lives in `src/features/pdf/pdf-parser.ts` (857 lines). It opens the PDF with pdfjs three times (metadata, text, link annotations). The text path joins every pdfjs text run on a row into one string, finds section headers through `printedTitle` (spec 0006) plus a legacy list, and then runs one of three per template functions that are near copies: they differ only in how headers are compared, and all three call the same shared readers for experience, education, skills, languages and interests. Section order is hardcoded rather than read from `TEMPLATE_LAYOUTS[id].sections`.

What the templates actually print differs a lot. `developer` prints `Company | Position`, then `start - end | location`. `default` prints position and dates side by side on one row, then company and location side by side. `veterinary` prints position, company and dates on three lines. Skills and interests are separate tags, which become one merged string once runs are joined, so multi word skills split into words. Dates are formatted with `Intl` in the export language, but the parser only knows English month names and `Present`, so Polish `Obecnie` and Polish months are lost. The GDPR clause is filtered out by an English only keyword list, and its setting is never recovered.

The tests (`pdf-parser.test.ts`, 356 lines) feed handwritten text that matches what the parser expects, not what the PDF prints, so they cannot catch any of the above. Errors from pdfjs reach the user as raw English `err.message` text, and a PDF the parser cannot read silently replaces the form with an almost empty resume.

Constraints: client only, no backend; render and parse change together (templates AGENTS.md); spec 0006 made the shared model the source of titles and section order; spec 0002's one way rule lets `pdf` import `templates/model`; the build approach is Tracer Bullet; `@react-pdf/renderer` must never enter an eagerly loaded bundle; the preview script already renders all templates in Node and reads them with the legacy pdfjs build.

## Options considered

### Option 1: Fix in place, split the file as is

Move today's functions into modules one to one (text, detect, three template parsers, shared readers), add characterization tests that snapshot current output on real renders, then fix bugs one by one afterward.

**Pros**:

- Smallest diff, lowest risk of changing behavior during the split.
- Snapshots make any change visible.

**Cons**:

- Snapshots pin output already known to be wrong for `default`, `veterinary` and Polish, so every fix is a snapshot rewrite with no contract behind it.
- Keeps joined string lines, so tags and side by side columns stay unrecoverable.
- Keeps three copies of the template function and the hardcoded section order.

### Option 2: Strangler restructure, one pass pipeline with per template readers (chosen)

Open once, keep text runs with positions, detect template and language together from printed titles, split sections in the order they are found, and read each section with a typed reader per template that mirrors that template's renderer. Real round trips (render, drop metadata, import) define correct. The new entry goes live in the first slice with a bridge to the old parser for templates not yet moved.

**Pros**:

- Correct output for every template and both languages, proven by real renders, not by guesses about the text.
- `satisfies SectionReaders` makes a new section fail the build until the import reads it, matching the renderers.
- Runs with positions recover tags and columns; one open cuts pdfjs work by two thirds.
- The strangler bridge keeps the app shippable after every slice.

**Cons**:

- Most new code and files; readers must follow every printed layout change.
- Depends on run geometry, which a react-pdf upgrade could change.
- Needs a second Vitest project (Node environment, file system font base) and a slower suite.

### Option 3: One generic parser driven by per template config

A single entry reader takes per template data (line order, regexes, separators) instead of code per template.

**Pros**:

- Less code; adding a template is mostly data.

**Cons**:

- The three layouts already differ in structure (side by side cells vs stacked lines), so the config grows conditionals and becomes a small language that is harder to read than code.
- No type check ties a new section to the config the way `satisfies` does for functions.

### Option 4: Drop the text fallback

Import only through embedded metadata; anything else shows an error.

**Pros**:

- Deletes nearly all parsing code and its maintenance.
- Exports already round trip exactly through metadata.

**Cons**:

- A user whose PDF lost its metadata (printed to PDF, edited, merged) can no longer import their own resume.
- Throws away the one recovery path the product currently promises.

## Rationale

The real problem is not file size but that the fallback was never measured against what the templates print, and the reading shows it is wrong for two of three templates and for every Polish export. Option 1 would make the split safe but lock in that wrongness behind snapshots. Option 4 removes the problem by removing the feature, which the engineer did not want: the fallback is the only recovery for PDFs that lost their metadata. Between Options 2 and 3, the templates' layouts diverge in structure, not just in strings, so code per template is clearer than a config language, and it gives the same compile time guarantee spec 0006 built for the renderers (`satisfies` over `SectionId`). Keeping runs with x positions is what makes tags and side by side columns readable at all; joined strings cannot be split back.

Detecting language together with template, from the same `printedTitle` sets, uses data the model already owns and avoids guessing from the UI language (wrong whenever someone imports a Polish resume in the English UI). Opening the PDF once is a free win that also makes the source testable: `readPdfSource` takes the pdfjs module, so the round trip test passes the legacy Node build the preview script already uses, and the test can drop `metadataCreator` instead of rewriting PDF bytes.

The round trip is the contract. It compares against the input fixture with a short, written list of losses for things the PDF never prints (education months, the first and last name boundary, normalized bullet markers, lone degree or field in joined layouts). Anything else that differs is a bug, and any new loss must be added to the list on purpose. The strangler bridge in slice 1 respects the Tracer Bullet approach: the new entry is real from day one, and each later slice moves one template, so a revert is always one slice. Lazy loading the import code is left to feature 10 because it is a bundle decision with its own budget; this spec keeps `loadResumeFromPDF` the single entry so that change stays one line.

Smaller calls made while writing: contact links keep the annotation URL exactly (no trailing slash removal), since the href is the user's original value and stripping it was an avoidable loss (runner up: keep stripping, which would add a loss to the list). The header match modes move over unchanged rather than switching everything to whole line equality, because legacy exports were matched that way and AC-12 must keep them (runner up: equality everywhere, simpler but untested against old files). The round trip runs as a second Vitest project with a file system `base`, the same mechanism the preview script uses for fonts (runner up: mocking font loading, which would test a PDF that differs from the real one).

Calls made during the build and written back into the spec (amendment, 2026-11-04):

- `CELL_GAP` went from 0.5 to 1, and whitespace runs stopped counting as cell boundaries. pdfjs inserts a whitespace run into every gap, and a Fira Code word space is about 0.6 font sizes, so 0.5 split `React Native` in two. The smallest real cell gap measured is about 1.6 (veterinary tags), so 1 sits safely between them.
- Headers match against `headerText`, not `lineText`. default prints titles letter spaced, and pdfjs returns them as `P R O F I L E`; the plain join the spec assumed would never equal the title. Closing up only runs that are entirely single characters separated by single spaces leaves normal text alone.
- Links are read inside `readHeader`, not laid over afterwards. Matching a URL to its printed cell is what tells the header which cell is the location, so the overlay had to happen while the cells are classified. `resumeFromSource` was split out of `loadResumeFromPDF` so the round trip runs the app's exact path without a `File`.
- The loss list grew one entry (9, contacts a template never prints) and got exact on three (5 splits at `in` with spaces, 7 is a no op for every fixture, 8 is applied only where a fixture needs it). Each was found by the round trip, which is the contract working as intended.
- After the code review, the GDPR footer moved from "starts with the clause's first three words" to "the remaining lines are exactly the clause". The old rule cut any section line that happened to open with `I hereby give` off as the footer. Sharing one matcher with `readGdpr` also means the footer is found only when it will actually read back (runner up: match the whole text before the company name on the first line, which still trusts a prefix).
