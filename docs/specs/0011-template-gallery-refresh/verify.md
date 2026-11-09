# 0011. Template gallery refresh: verify

Suggested checks in a real browser against `pnpm build` and `vite preview`. Skip any you have covered another way.

| Check                                                                                                                                   | Proves                 |
| --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| At 1440px, open `/templates` in light and dark: one `h1`, three whole A4 sheets, no gradients or moving background                      | AC-1, AC-2, AC-3, AC-4 |
| Hover a sheet: only the shadow changes. Tab through the page: every link has a visible focus outline                                    | AC-4, AC-9, AC-22      |
| Click a sheet, then Preview, then Use Template: each goes to the right URL, and the last has `?templateId=`                             | AC-5                   |
| Switch to PL: images and all strings change, with no raw keys                                                                           | AC-7, AC-16, AC-18     |
| Network panel at 1440px at 2x density: cards request the `-card.webp` files                                                             | AC-6, AC-7             |
| Block a preview image: a blank white sheet shows, with no broken icon                                                                   | AC-8                   |
| With a saved resume: the notice shows and Continue editing opens the builder on the stored template. With no saved resume, it is absent | AC-10                  |
| Set `resumeData_lastSaved` to 2 minutes ago in PL: the notice reads `2 minuty temu`                                                     | AC-11                  |
| Detail at 1440px on a throttled connection: the image shows at once, then the PDF replaces it with no jump                              | AC-12, AC-13           |
| Detail at 1440px in Chrome, Safari and Firefox: the swap to the PDF leaves at most a short blank moment, and the PDF is drawn           | AC-13                  |
| Veterinary detail at 1440px: page 2 can be reached by scrolling inside the panel                                                        | AC-13                  |
| Detail at 390px: only the image shows, and the network panel has no `react-pdf` chunk                                                   | AC-14                  |
| Block the viewer chunk at 1440px: the image stays, with no error message, and Use Template works                                        | AC-15                  |
| Switch language on the detail page at 1440px: text, image and PDF all update                                                            | AC-16                  |
| Open `/templates/nope`: the not found heading and back link show                                                                        | AC-17                  |
| Compare the head tags on both routes with `main`                                                                                        | AC-19                  |
| Open `/preview`: same PDF, scale, mode switch and export as `main`                                                                      | AC-20                  |
| Run `pnpm templates:previews --diff`, `pnpm perf:lighthouse` and `pnpm pre-commit`                                                      | AC-6, AC-20, AC-21     |
| At 320px on both pages: no sideways scroll                                                                                              | AC-22                  |
