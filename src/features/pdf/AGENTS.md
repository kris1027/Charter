# PDF export and import

The export (`pdf-export.tsx`) and import (`import/`, entry `import/load-resume.ts`, plus `pdfjs-singleton.ts`; round trip proven by `import/round-trip.pdf.test.tsx`) side of the PDF round trip. Render and parse change together, so the conventions, key files and gotchas live in one place: [the PDF templates context file](../templates/pdf/AGENTS.md).

The live preview engine (worker, client, page drawing, `PreviewPages`) the builder and `/preview` share lives in `live-preview/` (spec 0009, spec 0013); its conventions are in the same context file.
