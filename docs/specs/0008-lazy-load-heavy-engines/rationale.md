# 0008 rationale: Lazy load heavy engines

## Context

Spec 0003 measured each page's first load JavaScript and set budgets at today's size plus 5%. It left the cuts to this feature. The measurement on 2026-11-05 showed two problems.

First, `/preview` and `/templates/$templateId` imported `@react-pdf/renderer` statically, through `PDFViewer` and `TemplatePDF`, so about 355 KiB of brotli JavaScript (the PDF engine, the template renderers and font registration) had to arrive before either page could draw its frame. Export already loaded the engine with `import()`, but the on screen viewer did not.

Second, a `manualChunks` rule put `motion` in its own chunk, and that chunk also captured React. Every page, the landing included, therefore loaded the full motion library (about 39 KiB with React). The landing uses motion for about 23 elements: `whileInView` fades on content below the fold, and `useScroll` / `useTransform` parallax on decorative layers. The hero text itself uses a CSS animation, so the largest visible element never waited on motion.

The scope's Done when for feature 10 says the landing ships none of the heavy engines, export and import still work offline, and every page meets its budget. The forces are: keep the current look (the templates and pages are refreshed later, in Slice 3), keep the PWA working offline, stay inside the React Compiler and layering rules (features may not import `@/app`), and do it without a rewrite that feature 12 will throw away. This was first built under an `Assumed` record and is ratified here, anchored to that build.

## Options considered

### Option 1: Keep motion eager, split only the PDF engine

Move react-pdf out of the two PDF pages and leave motion as it is. Change the Done when to allow the animation library on the landing.

**Pros**:

- Smallest change, with no risk to animation behavior.
- No new conventions to learn.

**Cons**:

- The landing keeps about 19 KiB that it can drop.
- Changing the scope's Done when to fit the build reverses the order: the target should drive the build, not the other way round.

### Option 2: LazyMotion with async features (chosen)

Switch every `motion.*` to `m.*` inside one `LazyMotion` whose `features` load `domAnimation` with `import()`. Make the PDF viewer a `React.lazy` component and route all other PDF renders through one helper that imports the engine.

**Pros**:

- This is motion's own documented pattern for this exact problem, with no custom animation code.
- The look is unchanged and the diff is mostly mechanical (`motion.` to `m.`).
- `strict` mode catches a stray full component at runtime.

**Cons**:

- Below the fold content depends on a second request to become visible, so it needs a failure fallback.
- The `m` shell and scroll hooks (about 18 KiB) stay eager.
- It is limited to `domAnimation` features unless someone opts into the larger `domMax`.

### Option 3: Replace motion with CSS and IntersectionObserver

Write the fades as CSS keyframes triggered by a small in view hook, and the parallax with CSS scroll driven animations (`animation-timeline: view()`). Remove motion from every page.

**Pros**:

- No motion code at all in any first load.
- Content is visible by default if JavaScript fails, since CSS defines the end state.

**Cons**:

- It is a rewrite of every animated element, and feature 12 rebuilds the landing anyway.
- Scroll driven CSS is not supported in every browser yet, so parallax would silently disappear on some.
- The look would likely shift slightly (easing, timing), which needs design review.

### Option 4: Lazy load whole animated sections

Keep `motion`, but put each animated section below the fold behind `React.lazy`, so motion arrives with the section.

**Pros**:

- No change to how animations are written.

**Cons**:

- Content (text that should be indexable and accessible right away) would wait on JavaScript, which is worse for SEO and layout shift than waiting on an animation.
- Many small lazy boundaries, each with its own fallback.

## Rationale

The decision keeps the current look and solves the measured problem with the library's own mechanism. Option 1 leaves the stated target unmet. Option 3 meets it fully but spends a rewrite on a page that feature 12 replaces, and it trades a known library for hand written animation code. Option 4 delays content, not decoration, which is the wrong thing to make lazy.

Option 2's real risk is that content below the fold now waits on a second file. A failed load (a flaky first visit, or a stale service worker pointing at a file hash that no longer exists) would leave content invisible. A stalled load would leave it invisible for as long as the request hangs. Neither is acceptable. The first design flipped a flag so the variants would drop their hidden start state, but a cross check showed that cannot work: `m` builds its inline style from `initial` once at mount, so elements already on screen would stay at `opacity: 0`. Remounting the tree would wipe the builder's form state. So the decision is a CSS escape hatch. Animated elements carry `data-entrance`. When the import fails or 8 seconds pass, `MotionProvider` sets `data-motion-failed` on `<html>`, and one `!important` rule forces those elements visible. It is a few lines, touches no caller, and covers both failure and stall. The eager `m` shell and scroll hooks are accepted: they drive decorative parallax only, and moving them out would mean a lazy decorative layer on every page for about 6 KiB.

The PDF side has no real alternative worth weighing. The viewer must not be in the first load, `React.lazy` is the standard tool, and one `renderResumePdf` helper keeps the import in one place. Prefetching was considered and declined: the router has no preload set up, so before this change the engine was not warmed early either. Prefetching on builder idle would charge every builder visit 350 KiB for a preview the user may never open.

Two guards keep the gain. A lint rule stops a `motion` import before it ships, since `strict` only fails when that page renders. The byte budgets alone would not catch the 12 KiB motion engine slipping back, so `perf:size` also checks which engines each route's first load contains. The first design compared closures (an engine's reachable files minus the entry's), but run against the real manifest it flagged four routes that only share small chunks with the engines. So the check looks only at each engine's own chunk, the manifest keys that match the engine's substring. It fails when a substring matches nothing, so a file rename cannot quietly disable it.
