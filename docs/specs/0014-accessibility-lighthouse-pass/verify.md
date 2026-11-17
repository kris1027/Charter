# 0014. Accessibility and Lighthouse pass: verify

The manual WCAG 2.2 AA checklist for AC-13, plus suggested checks for the automated parts. Run against `pnpm build` and `vite preview` in Chrome, with a keyboard and a screen reader (VoiceOver on macOS is fine). Record each result in [rationale.md](rationale.md#manual-review).

## Manual WCAG 2.2 AA checklist

Run each on `/`, `/templates`, `/templates/developer`, `/builder` and `/preview` unless the row names pages. EN light is enough unless the row says otherwise.

| Criterion                                                                     | Check                                                                                                                                                                                          |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1.1 Keyboard, 2.1.2 No keyboard trap                                        | Tab through each page from the top: every control is reachable and usable, menus, dialogs, sheets, popovers and selects open with Enter or Space and close with Escape, focus never gets stuck |
| 2.4.3 Focus order, 3.2.1 On focus                                             | Focus moves in reading order; closing an overlay returns focus to its trigger; focusing nothing changes the page                                                                               |
| 2.4.7 Focus visible, 1.4.11 Non text contrast                                 | Every focused control shows a visible ring in light and dark; input borders, the section strip progress and switches reach 3:1 against their background                                        |
| 2.4.11 Focus not obscured (minimum)                                           | On `/builder` and `/preview` at 1350px and at 412px, tab down the page: no focused control is fully hidden under the sticky toolbar, section strip, page strip or the preview sheet trigger    |
| 2.5.7 Dragging movements                                                      | In experience, education and languages, reorder a card without dragging (keyboard or buttons); the same for skill and interest chips                                                           |
| 2.5.8 Target size (minimum)                                                   | At 412px, every pointer target is at least 24 × 24 CSS px or has enough spacing (toolbar icons, chip remove buttons, drag handles, date picker days, theme and language toggles)               |
| 1.4.10 Reflow, 1.4.4 Resize text                                              | At 320px and at 200% zoom on desktop, in EN and PL: no sideways scroll except the resume pages, no clipped text                                                                                |
| 1.4.12 Text spacing                                                           | With a text spacing bookmarklet (line height 1.5, letter 0.12em, word 0.16em, paragraph 2em) nothing is cut off on the toolbar, strip, cards and dialogs                                       |
| 1.3.1, 3.3.1, 3.3.2, 3.3.3 Forms                                              | On `/builder`: every field has a visible label; leave first name, last name and email invalid, blur: the error is announced and tied to the field, in EN and PL                                |
| 4.1.3 Status messages                                                         | Toasts (save, import, export), the builder preview status and the `/preview` page count are announced by the screen reader without moving focus                                                |
| 2.2.2 Pause, stop, hide; reduced motion                                       | With "Reduce motion" on in the OS, the landing page has no parallax or entrance motion and all content is visible                                                                              |
| 3.1.1, 3.1.2 Language                                                         | Switch to PL: `<html lang>` becomes `pl` and the screen reader reads Polish; the language menu names each language in its own language                                                         |
| 1.1.1 Non text content                                                        | Gallery images, template previews and the preview canvases have a name that says what they show; decorative layers are hidden from the screen reader                                           |
| 2.4.2 Page titled, 2.4.6 Headings                                             | Each route has its own title in EN and PL, one `h1`, and headings in order                                                                                                                     |
| 3.2.6 Consistent help, 3.3.7 Redundant entry, 3.3.8 Accessible authentication | Confirm not applicable (no help mechanism repeated across pages, no multi step entry, no sign in) and record it                                                                                |

## Suggested checks for the automated parts

| Check                                                                                                                        | Proves                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `pnpm a11y` on the final branch exits 0, and `.a11y/axe-results.json` holds 108 scans                                        | AC-1, AC-3, AC-5, AC-11 |
| Delete the theme toggle's `sr-only` label locally, run `pnpm a11y:scan`: it fails with `button-name` on `/` in every variant | AC-1, AC-2, AC-6        |
| Add an exception with an empty `reason`: the script fails before scanning                                                    | AC-2                    |
| On the PR, the `accessibility` job shows the summary table and the `.a11y` artifact                                          | AC-6, AC-7              |
| On the PR, the Lighthouse summary lists 22 URLs, every median at least 0.95                                                  | AC-8, AC-9, AC-11       |
| `lighthouserc.cjs` floors are all in [0.95, 1.00] and match the recorded baseline                                            | AC-10                   |
| `/builder` best practices is 1.00, or the cause is recorded                                                                  | AC-12                   |
| `pnpm pre-commit` passes and `pnpm templates:previews --check` regenerates nothing                                           | AC-14                   |
