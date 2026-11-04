# 0007. PDF import parser: one pass pipeline with per template readers, proven by real round trips

**Date**: 2026-11-04
**Status**: Accepted
**Amended**: 2026-11-04, after the build: AC-1 and AC-9 signatures (`resumeFromSource`, links read inside `readHeader`), AC-3 (`headerText`, `CELL_GAP = 1`, whitespace runs), AC-5 (`headerText`, `HEADER_MATCH` shape), AC-11 (`.tsx`, helper location, losses 5, 7, 8 made exact, loss 9 added). Then after the code review: AC-2 (a failed `destroy` is swallowed), AC-6 (the footer is the exact clause, not its first words), AC-7 (developer `field` by relative size, bullet marker inside a run), AC-8 (levels case insensitive), Build plan 1.1 (`env.BASE_URL`, not `base`). The decision is unchanged.

## Summary

The import reads a resume PDF back into the form. Exported PDFs already carry an exact copy of the data (embedded metadata), so the text parser only runs when that copy is missing, for example after someone prints the PDF to a new file. Today that parser is one 857 line file that opens the PDF three times, reads all three templates with one shape that only fits `developer`, and only knows English dates. This spec splits it into small steps (open once, rebuild lines, detect template and language, cut sections, read each section with a reader made for that template). Real exports of every template in English and Polish, rendered in a test with the metadata removed, must come back equal to the input, apart from a short written list of things the PDF never prints.

## Requirements

**User stories**:

- As a job seeker, I want a PDF I exported from this app (even one whose embedded data was lost) to load back into the form in the language and template it was made with, so that I do not retype my resume.
- As a job seeker, I want a clear message in my language when a PDF cannot be read, so that I know to fill the form by hand and my current resume is not wiped.
- As the developer, I want each import step to be its own small, tested module, and a new section or template change to fail the build or a test until the import handles it, so that render and parse never drift apart silently.

**Acceptance criteria**:

- **AC-1**: `loadResumeFromPDF(file: File): Promise<ResumeFormValues>` lives in `src/features/pdf/import/load-resume.ts` and stays the only entry the app calls (`use-pdf-import.ts` imports it from there). It opens the PDF once through `readPdfSource` (AC-2) and returns `resumeFromSource(source)`. `resumeFromSource(source: PdfSource): ResumeFormValues`, exported from the same file, is the whole decision: `parseResumeMetadata(source.metadataCreator) ?? readResumeFromText(source.lines, source.linkUrls)`. `readResumeFromText(lines: readonly TextLine[], linkUrls: readonly string[] = [])` (AC-3 to AC-8) passes `linkUrls` to `readHeader`, which takes the `website`, `github` and `linkedin` values from AC-9 (email and phone always come from the printed text, which equals the link). The round trip (AC-11) calls `resumeFromSource` with `metadataCreator` removed, so it runs exactly the app's path. Metadata handling (`resume-metadata.ts`, payload `v: 1`) is unchanged.
- **AC-2**: `readPdfSource(data: Uint8Array, pdfjs?)` in `import/read-pdf-source.ts` calls `getDocument` exactly once (default `pdfjs` from `getPdfjs()`; tests pass the legacy Node build), reads `info.Creator` (string or `undefined`), every page's text content into `TextLine[]` (AC-3) and every page's link annotation URL (`url ?? unsafeUrl`, strings only, page order), and destroys the loading task in a `finally`; a rejected `destroy` is swallowed there, so cleanup never replaces the returned source or the mapped error. It returns `PdfSource { metadataCreator?: string; lines: TextLine[]; linkUrls: string[] }`. pdfjs errors named `PasswordException` become `PdfImportError('password')`, errors named `InvalidPDFException` (or any other failure while opening) become `PdfImportError('invalid')`.
- **AC-3**: `import/text-lines.ts` exports `buildTextLines(items, page): TextLine[]`, where `TextRun = { text; x; width; fontSize }` (`x = transform[4]`, `width = item.width`, `fontSize = Math.hypot(transform[2], transform[3])`) and `TextLine = { y; page; runs: TextRun[] }`. Rows group by rounded `transform[5]` within 2 units, top to bottom, runs left to right, empty strings skipped, exactly as today. It also exports `lineText(line)` (runs joined with `''`, whitespace collapsed, trimmed), `headerText(line)` (like `lineText`, but a run that pdfjs returns letter spaced, matching `^\S( \S)+$` such as `P R O F I L E`, is closed up first; used only for header matching, AC-5), and `cells(line, gap = CELL_GAP)`, which splits a line into strings wherever the gap between the previous text run's end (`x + width`) and the next text run's `x` is larger than `gap × run.fontSize`. pdfjs fills every gap with a whitespace run, so whitespace runs never start a cell and never count as the previous run; they join the cell before them and are collapsed away. `CELL_GAP = 1` (tuned from the starting 0.5 against AC-11, and commented in the code): a Fira Code word space is about 0.6 font sizes, while the smallest real cell gap (veterinary tags) is about 1.6 and contact items are above 3. A `buildTextLineStrings(items): string[]` wrapper returns `lineText` of each line and drops lines whose text is empty after collapsing, exactly as today; `scripts/templates/build-previews.ts` loads it from the new path (its `TextLinesModule` type renamed to match), its text snapshots stay byte equal (`pnpm templates:previews --diff` passes against a baseline taken before the move), and `src/features/pdf/pdf-text-lines.ts` is deleted.
- **AC-4**: `detectLayout(lines): Detected | null` in `import/detect-layout.ts` scores every `TemplateId` × `AppLang`: the number of section ids whose header is found (AC-5 header rules; legacy headers count for `en` only). The highest score wins; a tie goes to the first in `TEMPLATE_IDS` order, then `APP_LANGS` order. It returns `{ templateId, lang, headerHits }`, or `null` when every score is 0. `readResumeFromText` throws `PdfImportError('unrecognized')` on `null`.
- **AC-5**: `import/section-headers.ts` owns header lookup through `findHeaderIndex(lines, templateId, sectionId, lang): number` (`-1` when absent). Titles come from `printedTitle(templateId, id, lang)`, plus today's `LEGACY_HEADERS` (English only) moved over unchanged. Match modes live in `HEADER_MATCH: Record<TemplateId, Record<SectionId, { title: HeaderMatch; legacy: HeaderMatch }>>` with `HeaderMatch = 'includes' | 'equals'`, values kept from the old parser: developer `includes` for all five; default `equals` for all five; veterinary `includes` for experience and education, `equals` for skills and languages, and for interests `includes` on the printed title but `equals` on the legacy `Interests`. Matching compares against `headerText(line)` (AC-3), not `lineText`: default prints its titles with letter spacing, which pdfjs returns as `P R O F I L E`, and a plain join would never equal the title. It is case sensitive as today and never uses `cells`.
- **AC-6**: `splitSections(lines, detected): SectionSlices` in `import/split-sections.ts` finds each section's header line, then sorts the found headers by position, so each section runs from its header to the next found header in the order the PDF prints them (not a hardcoded order). `header` is every line before the first found header. `footer` is the GDPR clause: `findGdprStart(lines, firstHeader, lang)` in `read-gdpr.ts` returns the first line after the first header from which the lines to the end, joined and whitespace collapsed, are exactly the detected language's clause (the same matcher `readGdpr` uses, AC-8), or `-1`. A line that only opens with the same words (`I hereby give talks …`) stays in its section. The footer is removed from whatever section it would fall into. Lines from every page are read as one stream.
- **AC-7**: Each template has `import/readers/<templateId>.ts` exporting `const readers = { … } satisfies SectionReaders`, where `SectionReaders = { [K in SectionId]: (lines: TextLine[], ctx: { lang: AppLang }) => ResumeFormValues[FieldOf<K>] }` (experience → `experiences`, education → `education`, skills, languages, interests). `readers/index.ts` maps `TemplateId → SectionReaders` with `satisfies Record<TemplateId, SectionReaders>`, so a new `SectionId` or `TemplateId` fails `pnpm build` until every template can read it. Skills, languages and interests use shared readers in `readers/shared.ts` that read one item per cell (`cells`), so multi word items such as `React Native` survive. Experience and education readers follow each template's printed layout:
    - Experience entries are anchored on the date line, which always prints (`start - end`). developer: the line before it is `Company | Position` (split at the first `|`), the date line is `start - end[ | location]` (location after the first `|`). veterinary: the two lines before it are `Position` then `Company`, the date line as developer. default: the entry starts on a line whose second cell is `start - end`, its first cell is `Position`; the next line's cells are `Company` and optional `Location`.
    - Education entries are anchored on the years line (`startYear - endYear`, printed even when empty). developer prints `field` (printed larger than the rest of the entry), then `degree - institution` (joined only when both exist), then years: an entry's head is the line just before the years line plus, when it is printed larger than the years line, the one before that (`readYearsLast` in `readers/entries.ts`); a head line larger than the years line is `field` (a relative size, so compact exports read the same); the line just before the years splits at the first `-` into `degree` and `institution`, and with no `-` it is the `institution` when a field line exists, else the `degree`. default prints cells `Degree in Field` and years on one line, then `Institution`. veterinary prints `Degree in Field`, `Institution`, then years. For default and veterinary, `Degree in Field` splits at the first `in` (with spaces); a lone value is `degree`. Any lines after the years line up to the next entry's first line are the `description`, joined with `\n`.
    - Bullets: a bullet is a line whose first non blank run starts with `•` (its own run, or merged into the front of the text run). A following line without a bullet joins the bullet above with one space only when its first run's `x` is greater than the `•` run's `x` (by more than 0.5) (bullet text is indented, entry lines are not), so wrapped bullets come back whole and the next entry is never swallowed.
      Personal info comes from `readHeader(lines, ctx: { templateId: TemplateId; linkUrls: readonly string[] })` in `readers/header.ts` (it needs the template for `contactRows` and the URLs for AC-9, not `lang`). The first line is the name (first word → `firstName`, the rest → `lastName`). The next line is `title` when its largest run `fontSize` is larger than the contact text size (the smallest size in the header), else `title` is `''`. The contact cells are `cells` of the remaining lines; `readHeader` calls `contactFromLinkUrls(linkUrls, printedCells)` (AC-9). A cell with `@` is `email`, a cell of digits, spaces, `+`, `(`, `)` and `-` with at least 7 digits is `phone`, a cell whose text matches the display of a `website`, `github` or `linkedin` link URL (through `formatWebsiteDisplay`, `formatGithubDisplay`, `formatLinkedinDisplay` or the raw URL) takes that URL, and with link annotations the one cell left is `location`. With no link annotations, remaining cells are matched in `TEMPLATE_LAYOUTS[templateId].contactRows` order (kinds already found skipped, a cell takes the first kind it fits, the last kind left takes any cell), and website, GitHub and LinkedIn are rebuilt as `https://` plus the printed text, `https://github.com/` plus the handle, `https://linkedin.com/in/` plus the handle.
- **AC-8**: Language aware values use the detected `lang`. Dates: `readMonthYear(text, lang)` in `readers/dates.ts` accepts long and short month names from `getMonthNames` for that language (both styles, case insensitive, with or without a trailing dot) and returns `YYYY-MM`; the template's `present` string (`Present` / `Obecnie`) sets `current: true` and `endDate: ''`. Education years read as `YYYY-01`. Language levels accept `A1` to `C2` (case insensitive, returned upper case) and the language's `native` label (`Native` / `Ojczysty`, plus the legacy `NATIVE`) and return `NATIVE` for it. GDPR: `readGdpr(footer, lang)` in `import/read-gdpr.ts` joins the footer lines with one space, then builds a matcher from `getPDFStrings(lang).gdprConsent(<placeholder>)` (text before and after the company name) and `gdprConsentGeneric`, compared after whitespace collapse; a match sets `gdprConsent.enabled = true` and `companyName` (empty for the generic text); no footer gives `{ enabled: false, companyName: '' }`.
- **AC-9**: `contactFromLinkUrls(urls: string[], printed: readonly string[] = []): ContactLinks` in `import/contact-links.ts`, where `ContactLinks = Partial<Pick<PersonalInfo, 'website' | 'github' | 'linkedin'>>`. It keeps each URL exactly as the annotation reports it (no trailing slash removal) and returns only those three kinds, all patterns case insensitive: a URL matching `^https?://(www\.)?github\.com/` → github, `^https?://([a-z]{2,3}\.|www\.)?linkedin\.com/` → linkedin, any other `^https?://` URL → website, and a URL with no scheme at all whose text is in `printed` → website (the `edges` bare `anna.dev`); any other scheme (`mailto:`, `tel:` and so on) is ignored. The first of each kind wins. `printed` is the header's contact cells, passed in by `readHeader` (AC-7), which is the only caller; `loadResumeFromPDF` does no overlay of its own.
- **AC-10**: `PdfImportError` (`import/pdf-import-error.ts`) has `code: 'invalid' | 'password' | 'unrecognized'`. `use-pdf-import.ts` shows `t(\`dialogs.pdfError.${err.code}\`)`for a`PdfImportError`and`t('dialogs.pdfError.unexpected')`for anything else (never a raw`err.message`), and leaves the form and storage untouched on any error. New keys `dialogs.pdfError.invalid`, `.password`, `.unrecognized`land in both`src/locales/en`and`src/locales/pl`; the unused `dialogs.pdfError.notFromApp` is removed from both.
- **AC-11**: A round trip test (`src/features/pdf/import/round-trip.pdf.test.tsx`, `.tsx` because it renders JSX) renders `TemplatePDF` with `renderToBuffer` for every `TemplateId` × `AppLang` × fixture `full`, `edges`, `long` (18 renders, `compactScale` 0), reads it with `readPdfSource(new Uint8Array(buffer), legacyPdfjs)` (`pdfjs-dist/legacy/build/pdf.mjs`, no worker; the parameter is typed `Pick<typeof import('pdfjs-dist'), 'getDocument'>`), calls `resumeFromSource({ ...source, metadataCreator: undefined })` (AC-1), and expects `toEqual(expectedAfterPrint(fixture, templateId))`. A 19th case renders with metadata and expects the input back exactly. The shared preview fixtures are not edited (their education years `20${n}-10` print as three digits, and changing them would break the preview baseline): `round-trip-fixtures.ts` copies `full`, `edges` and `long` and replaces every education `startDate`/`endDate` with real four digit years (for example `2010-10` / `2014-06`). Both `round-trip-fixtures.ts` and `expected-after-print.ts` sit beside the test in `src/features/pdf/import/` (test helpers, never imported by app code). `expectedAfterPrint` applies only these listed losses, each with a one line comment in the code:
    1. Education start and end become `YYYY-01` (only years are printed).
    2. `firstName` is the first word of the printed name, `lastName` the rest.
    3. Experience `description` becomes the printed bullets as `• text` joined with `\n` (markers `-`, `*`, `•`, `‣` and friends normalized as `parseDescriptionLines` does, blank lines dropped, a wrapped bullet's whitespace collapsed to single spaces).
    4. `current: true` gives `endDate: ''`.
    5. default and veterinary (not developer): degree and field print as `Degree in Field` (or the lone value), and read back split at the first `in` (with spaces): a lone value is `degree` with `field: ''`, and a degree containing `in` splits there.
    6. `templateId` is the detected template.
    7. Links come back as pdfjs reports them. For every fixture URL that is the input unchanged (pdfjs keeps the trailing slash of `https://anna.dev/`, and the bare `anna.dev` is also its printed text), so the helper changes nothing. If a pdfjs upgrade starts normalizing URLs, the helper applies pdfjs's form here, never a looser comparison.
    8. Text that collides with a separator splits at the first one. Applied: a developer `company` containing `|` keeps the text before it, and the rest joins the position as `rest | position`. Listed but not applied, because no fixture holds them: a developer degree or institution containing `-`, and an experience location containing `|`. A fixture that adds one adds its rule to the helper in the same change.
    9. A contact kind the template does not print reads back `''`: any of `website`, `github`, `linkedin` missing from `TEMPLATE_LAYOUTS[templateId].contactRows` (today default and veterinary print no GitHub).
       An empty section prints nothing and reads back as `[]`, which is no loss. Without link annotations (a PDF printed to a new file), GitHub and LinkedIn come back rebuilt from the printed handle (AC-7); that path is covered by unit tests, not the round trip. A resume with no section at all (like the `minimal` fixture) throws `unrecognized` by design (AC-4). No other difference is allowed; any new loss is added to this list with its reason in the same change.
- **AC-12**: Older exports keep importing: every legacy header case and every Polish detection case in today's `pdf-parser.test.ts` is ported to the new module tests (`detect-layout.test.ts`, `split-sections.test.ts`) and passes.
- **AC-13**: Every module in `src/features/pdf/import/` has a co-located `*.test.ts` covering its rules. `src/features/pdf/pdf-parser.ts` and `pdf-parser.test.ts` are deleted at the end. `src/features/templates/pdf/AGENTS.md` (key files, the parser convention line) and `src/features/pdf/AGENTS.md` name the new modules and the round trip test. `pnpm pre-commit` passes, `/builder` stays within its `perf:size` budget, and no module imports `@react-pdf/renderer` (only the round trip test does).

## Decision

**Chosen option**: Option 2: Strangler restructure into a one pass pipeline with per template readers that mirror the renderers.

Open the PDF once, keep text runs with positions, detect template and language from the shared model's printed titles, cut sections in printed order, and read each section with a typed reader per template, proven by round trips of real renders with the metadata removed.

**Implementation skills**: `vitest` (`antfu/skills`, `.agents/skills/vitest/`) · `react-pdf` (`molefrog/skills`, `.agents/skills/react-pdf/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch** (in memory types only, nothing is persisted; output stays `ResumeFormValues`, and `normalizeResume` still backfills in `use-pdf-import.ts`):

| Type             | Fields                                                                                         | Made by                               | Used by                           |
| ---------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------- |
| `TextRun`        | `text: string`, `x: number`, `width: number`, `fontSize: number`                               | `buildTextLines`                      | `lineText`, `cells`               |
| `TextLine`       | `y: number`, `page: number`, `runs: TextRun[]` (1..N)                                          | `buildTextLines`                      | every later step                  |
| `PdfSource`      | `metadataCreator?: string`, `lines: TextLine[]`, `linkUrls: string[]`                          | `readPdfSource` (one open)            | `loadResumeFromPDF`               |
| `Detected`       | `templateId: TemplateId`, `lang: AppLang`, `headerHits: number` (≥ 1)                          | `detectLayout`                        | `splitSections`, readers (`lang`) |
| `SectionSlices`  | `header: TextLine[]`, `sections: Partial<Record<SectionId, TextLine[]>>`, `footer: TextLine[]` | `splitSections`                       | `readHeader`, readers, `readGdpr` |
| `SectionReaders` | one function per `SectionId`                                                                   | `readers/<templateId>.ts`             | `readResumeFromText`              |
| `PdfImportError` | `code: 'invalid' \| 'password' \| 'unrecognized'`                                              | `readPdfSource`, `readResumeFromText` | `use-pdf-import.ts`               |

One `PdfSource` yields at most one `Detected`; one `Detected` yields one `SectionSlices`; each `SectionId` maps to one reader per template.

**Module map** (`src/features/pdf/import/`):

| File                                                                                                                          | Exports                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `load-resume.ts`                                                                                                              | `loadResumeFromPDF`, `resumeFromSource`                                                                                                 |
| `read-pdf-source.ts`                                                                                                          | `readPdfSource`, `PdfSource`                                                                                                            |
| `text-lines.ts`                                                                                                               | `buildTextLines`, `buildTextLineStrings`, `lineText`, `headerText`, `cells`, `CELL_GAP`, `TextLine`, `TextRun`                          |
| `section-headers.ts`                                                                                                          | `findHeaderIndex`, `LEGACY_HEADERS`, `HEADER_MATCH`                                                                                     |
| `detect-layout.ts`                                                                                                            | `detectLayout`, `Detected`                                                                                                              |
| `split-sections.ts`                                                                                                           | `splitSections`, `SectionSlices`                                                                                                        |
| `read-resume-text.ts`                                                                                                         | `readResumeFromText` (detect, split, header, readers, GDPR)                                                                             |
| `read-gdpr.ts`                                                                                                                | `readGdpr`, `findGdprStart`                                                                                                             |
| `contact-links.ts`                                                                                                            | `contactFromLinkUrls`, `ContactLinks`, `CONTACT_LINK_KINDS`, `ContactLinkKind`                                                          |
| `pdf-import-error.ts`                                                                                                         | `PdfImportError`, `PdfImportErrorCode`                                                                                                  |
| `readers/index.ts`, `readers/{developer,default,veterinary}.ts`, `readers/shared.ts`, `readers/header.ts`, `readers/dates.ts` | `SECTION_READERS`, `SECTION_FIELDS`, `SectionReaders`, per template readers, shared item readers, header reader, date and level parsing |
| `readers/entries.ts`                                                                                                          | entry helpers the template readers share (`readDateLine`, `readTimeline`, `readYearsLast`, `readDegreeField`)                           |
| `round-trip-fixtures.ts`, `expected-after-print.ts`                                                                           | test helpers for AC-11 only                                                                                                             |

**State transitions**: none (a pure pipeline: open → metadata or text → detect → split → read, with links read inside the header step).

**Interface surface** (no network API; module functions):

| Function                         | Inputs                              | Output                    | Errors                                    |
| -------------------------------- | ----------------------------------- | ------------------------- | ----------------------------------------- |
| `loadResumeFromPDF`              | `file: File`                        | `ResumeFormValues`        | `PdfImportError` (any code)               |
| `resumeFromSource`               | `source: PdfSource`                 | `ResumeFormValues`        | `PdfImportError('unrecognized')`          |
| `readPdfSource`                  | `data: Uint8Array`, `pdfjs?`        | `PdfSource`               | `PdfImportError('invalid' \| 'password')` |
| `readResumeFromText`             | `lines`, `linkUrls = []`            | `ResumeFormValues`        | `PdfImportError('unrecognized')`          |
| `readHeader`                     | `lines`, `{ templateId, linkUrls }` | `personalInfo`            | none                                      |
| `detectLayout`                   | `lines`                             | `Detected \| null`        | none                                      |
| `splitSections`                  | `lines`, `detected`                 | `SectionSlices`           | none                                      |
| `readers[templateId][sectionId]` | `lines`, `{ lang }`                 | that section's form value | none (unreadable lines are skipped)       |
| `readGdpr`                       | `footer`, `lang`                    | `gdprConsent`             | none                                      |
| `contactFromLinkUrls`            | `urls`, `printed = []`              | `ContactLinks`            | none                                      |

**Value sourcing**:

| Action            | Value produced                                  | Source                                                                                                                                                                                              |
| ----------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| metadata path     | whole `ResumeFormValues`                        | `info.Creator` through `parseResumeMetadata` (unchanged)                                                                                                                                            |
| detect            | `templateId`, `lang`                            | highest scoring printed title set (`printedTitle` × `TEMPLATE_IDS` × `APP_LANGS`) plus `LEGACY_HEADERS` (en)                                                                                        |
| read header       | `firstName`, `lastName`                         | first header line split at the first space                                                                                                                                                          |
| read header       | `title`                                         | second header line when its font size is above the contact text size, else `''`                                                                                                                     |
| read header       | `email`, `phone`                                | printed contact cell (`@`; digits pattern)                                                                                                                                                          |
| read header       | `website`, `linkedin`, `github`                 | link annotation URL (AC-9) matched to its printed cell inside `readHeader`, else the printed cell in `contactRows` order rebuilt into a URL (AC-7); `''` when the template does not print that kind |
| read header       | `location`                                      | the one contact cell left after the others are classified (no link exists for it)                                                                                                                   |
| experience        | `company`, `position`, `location`               | the template's entry lines (AC-7)                                                                                                                                                                   |
| experience        | `startDate`, `endDate`, `current`               | date cell through `readMonthYear(text, lang)` and `getPDFStrings(lang).present`                                                                                                                     |
| experience        | `description`                                   | bullet lines joined (AC-7), `• ` prefix kept                                                                                                                                                        |
| education         | `degree`, `field`, `institution`, `description` | the template's entry lines (AC-7)                                                                                                                                                                   |
| education         | `startDate`, `endDate`                          | printed years → `YYYY-01`                                                                                                                                                                           |
| skills, interests | `name`                                          | one per cell (`cells`)                                                                                                                                                                              |
| languages         | `language`, `proficiency`                       | cell text; level token, `native` label of `lang` → `NATIVE`                                                                                                                                         |
| GDPR              | `enabled`, `companyName`                        | footer matched against `gdprConsent` / `gdprConsentGeneric` of `lang`                                                                                                                               |
| errors            | dialog message                                  | `PdfImportError.code` → `dialogs.pdfError.<code>`; else `unexpected`                                                                                                                                |

**Key invariants**:

- The PDF is opened once per import and its loading task is always destroyed.
- Metadata, when valid, always wins over text; the text path never runs for a PDF with a valid `v: 1` payload.
- Every section header string comes from `printedTitle` or `LEGACY_HEADERS`; no other literal header in the import.
- A failed import never calls `writeResume` or `form.reset`.
- No user facing error text comes from `err.message`.

**Security model**: everything runs in the browser on a file the user picked; nothing leaves the device. The PDF is untrusted input: the 10 MB limit in `use-pdf-import.ts` stays, pdfjs parses it in its worker, the embedded JSON goes through `parseResumeMetadata` and `normalizeResume` as today, and no imported value is rendered as HTML. No compliance scope beyond what the app already has (resume data stays local).

**Configuration required**: none. `vitest.config.ts` gains a second project (Build plan step 1), no env vars.

**Critical test scenarios**:

- Happy path: each of 18 renders (3 templates × EN, PL × `full`, `edges`, `long`) with metadata removed reads back equal to `expectedAfterPrint`, verifies **AC-1**, **AC-3**, **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-11**.
- Metadata path: a render with metadata returns exactly the input through `loadResumeFromPDF`'s logic without touching the text readers, verifies **AC-1**.
- One open: `readPdfSource` with a spy pdfjs calls `getDocument` once and `destroy` once, also when a page read throws, and a failing `destroy` keeps the source or the error, verifies **AC-2**.
- Wrong file: a PDF with no known header throws `PdfImportError('unrecognized')`; a password PDF and a non PDF byte array throw `password` and `invalid`; the hook shows the translated message and does not reset the form, verifies **AC-4**, **AC-10**.
- Polish: `Obecnie` sets `current`, `sty 2024` / `styczeń 2024` give `2024-01`, `Ojczysty` gives `NATIVE`, Polish GDPR text with a company name sets it, verifies **AC-8**.
- Order: a section printed out of `SECTION_IDS` order still gets only its own lines, verifies **AC-6**.
- Footer: a section line that opens with the clause's first words stays in its section, verifies **AC-6**.
- Legacy: every ported legacy header and Polish detection case passes, verifies **AC-12**.
- Tags: a skill `React Native` next to `TypeScript` reads as two skills, not three, verifies **AC-3**, **AC-7**.
- Preview script: `--diff` text snapshots unchanged after the line builder move, verifies **AC-3**.

## Build plan

Tracer Bullet: the first slice threads one template through the whole new pipeline into the real import, with the old parser kept behind a bridge for the other two (strangler), then each slice widens it. The app imports correctly after every step.

1. **Slice 1, thread developer EN end to end.**
    1. Run `pnpm templates:previews --baseline` before touching anything. Add a second Vitest project in `vitest.config.ts` (`test.projects`), both with `extends: true` so they keep `reactPlugins()`, the aliases, `globals` and `setupFiles`: `unit` keeps today's settings, including today's `include` list (`src`, `scripts`, `eslint.config.test.ts`), and excludes `src/**/*.pdf.test.{ts,tsx}`; `pdf` uses `environment: 'node'`, `testTimeout: 60000`, includes `src/**/*.pdf.test.{ts,tsx}`, and sets `env.BASE_URL` to the absolute `public/` path with a trailing slash, so `pdf-fonts.ts` reads fonts from disk as the preview script does (a project level Vite `base` does not reach `import.meta.env`). Coverage stays at the root. Satisfies **AC-11**.
    2. `text-lines.ts` with runs, `lineText`, `cells`, `buildTextLineStrings`; switch the preview script to it, delete `pdf-text-lines.ts`, run `--diff` (text unchanged), then `pnpm templates:previews` and commit the manifest. Satisfies **AC-3**.
    3. `pdf-import-error.ts`, `read-pdf-source.ts` (one open, error mapping), `contact-links.ts` (exact URLs). Satisfies **AC-2**, **AC-9**.
    4. `section-headers.ts` (moved rules), `detect-layout.ts`, `split-sections.ts` with tests, porting the legacy and Polish detection cases. Satisfies **AC-4**, **AC-5**, **AC-6**, **AC-12**.
    5. `readers/shared.ts`, `readers/header.ts`, `readers/dates.ts` (EN first), `readers/developer.ts`, `readers/index.ts`; until steps 2 and 3 land, `readers/index.ts` maps `default` and `veterinary` to a bridge that calls the old `parseResumeFromText` on the joined `lineText` lines and picks the section (the bridge is English only, as the old parser is, so default and veterinary claim nothing new until their slices). Satisfies **AC-7**.
    6. `read-resume-text.ts`, `load-resume.ts`; point `use-pdf-import.ts` at it. Round trip test runs developer × EN × 3 fixtures and passes. Satisfies **AC-1**, **AC-11**.
2. **Slice 2, default.** `readers/default.ts` (cells for the side by side columns), remove its bridge entry, round trip default × EN. Satisfies **AC-7**, **AC-11**.
3. **Slice 3, veterinary.** `readers/veterinary.ts`, remove the bridge, round trip veterinary × EN. Satisfies **AC-7**, **AC-11**.
4. **Slice 4, Polish, GDPR and errors.** Polish months, `Obecnie`, `Ojczysty` in `readers/dates.ts` and shared readers; `read-gdpr.ts` and the footer cut in `split-sections.ts`; the hook's error mapping and the three locale keys in EN and PL (drop `notFromApp`). Round trip all 18 renders. Satisfies **AC-6**, **AC-8**, **AC-10**, **AC-11**.
5. **Slice 5, retire the old parser.** Delete `pdf-parser.ts` and `pdf-parser.test.ts` (every case already ported), update both PDF `AGENTS.md` files, run `pnpm pre-commit` including `perf:size`. Satisfies **AC-12**, **AC-13**.

## Migration plan

**Strategy**: strangler. The new pipeline replaces `loadResumeFromPDF` in slice 1, and a bridge sends the two templates not yet ported to the old parser until their own slice.
**Phases**: slice 1 (new entry live, developer on new readers), slices 2 and 3 (each template moves, bridge shrinks), slice 4 (language, GDPR, errors), slice 5 (old file deleted).
**Rollback**: each slice is one revertible commit or PR; reverting slice 1 restores the old import path untouched. No stored data changes.
**Risks**: run gaps from react-pdf may differ by font, so `CELL_GAP` might need a per template value (allowed, keep it in the reader and comment why); the round trip suite adds roughly 20 seconds to `pnpm test`.

## Consequences

**Positive**:

- PDFs without metadata from `default` and `veterinary`, and every Polish export, import correctly for the first time, proven by real renders.
- A new section or template fails the build until the import reads it, the same way the renderers already do.
- One PDF open instead of three.
- Users see translated, specific errors and never lose their current resume to a bad file.

**Negative / tradeoffs**:

- More files (about 15 modules plus tests) than one parser, and readers must change whenever a template's printed layout changes (that is the point, but it is work).
- The round trip suite is slow and needs a second Vitest project and the legacy pdfjs build in Node.
- Readers depend on run geometry (`CELL_GAP`); a react-pdf upgrade that changes how text runs come out can break them, caught by the round trip, fixed by tuning.
- The text fallback stays limited to this app's own layouts; PDFs from other tools still fail with `unrecognized`.

**Neutral**:

- The preview script imports the line builder from a new path; the manifest hash changes once.
- `notFromApp` locale key disappears.

## Follow-up

- [ ] Feature 10 (lazy load heavy engines) can turn `loadResumeFromPDF` into a dynamic import on file pick; this spec keeps it a single entry to make that a one line change.
- [ ] If a template later prints education months, remove loss 1 from `expectedAfterPrint`.
- [ ] Compact exports (`compactScale > 0`, used by the real export when a resume is long) are not in the round trip; the title by font size rule (AC-7) compares sizes within one PDF, so it should hold, but add a compact fixture if an import bug shows up there.
- [ ] The shared preview fixtures print three digit education years (`20${n}-10`); fixing them is a template preview change (new baseline and images), out of this feature.
