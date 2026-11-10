# 0012. Builder UI refresh: verify

Suggested checks in a real browser against `pnpm build` and `vite preview`. Skip any you have covered another way.

| Check                                                                                                                                 | Proves                   |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| At 1440px, open `/builder` in light and dark: no gradients, blur or moving shapes, one `h1`, every section looks the same             | AC-1, AC-6, AC-17, AC-18 |
| Scroll a long resume: toolbar and strip both stay pinned at 1440px and 768px; at 390px only the toolbar stays                         | AC-4, AC-11              |
| Use the strip: each link scrolls with the section clear of the bars, focus lands on its heading, and the URL does not change          | AC-14                    |
| Turn on reduced motion and use the strip: the jump is instant                                                                         | AC-14                    |
| Scroll slowly: the highlighted link follows, and at 390px the strip slides to keep it visible                                         | AC-15                    |
| Fill first name only: the percent moves, no check. Fill last name and email: Personal gets a check. Add a skill: Skills gets a check  | AC-12, AC-13             |
| Tab through the whole page at 768px: every focused control stays visible, never under a bar or the floating button                    | AC-16, AC-35             |
| At 320px in EN and PL: no sideways scroll, toolbar on one row                                                                         | AC-10                    |
| Fresh form, click Preview CV in the toolbar: three errors, focus on first name. Click again after fixing it: focus moves to last name | AC-22, AC-23             |
| Fill the required fields and click the bottom Preview CV: lands on `/preview` with your data                                          | AC-22, AC-39             |
| At 390px, make the form invalid with the worker unavailable, press Open preview in the sheet: the sheet closes, focus is on the field | AC-24                    |
| Menu: Load PDF shows the spinner in the status spot until done. Reset opens the dialog; on close, focus is on the menu button         | AC-7, AC-8, AC-9         |
| Add a card by keyboard: focus lands in its first field. Remove one: focus lands on Add. Same for a chip and its input                 | AC-27, AC-28             |
| Move a card up with its button: focus stays with it, and a screen reader says the new position                                        | AC-29, AC-31             |
| Open a chip's menu by keyboard and touch: move and remove work, focus stays sensible                                                  | AC-30, AC-31             |
| Reorder by keyboard with Space and arrows in PL: instructions and announcements are Polish                                            | AC-33                    |
| Open the live preview at 1440px: the panel clears both bars, pages are white in dark mode                                             | AC-34                    |
| Reset, PDF import, autosave and `?templateId=` work as on `main`                                                                      | AC-39                    |
| Switch to PL: no raw keys, no text overflow in the strip                                                                              | AC-37                    |
| Run `pnpm pre-commit` and `pnpm perf:lighthouse`                                                                                      | AC-2, AC-38, AC-40       |
