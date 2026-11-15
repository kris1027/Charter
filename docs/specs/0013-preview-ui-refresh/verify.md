# 0013. Preview UI refresh: verify

Suggested checks in a real browser against `pnpm build` and `vite preview`. Skip any you have covered another way.

| Check                                                                                                                                     | Proves                     |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| At 1440px, open `/preview` with a saved resume in light and dark: no gradients or blur, one `h1`, white pages on a muted area             | AC-1, AC-3, AC-5, AC-9     |
| On a real phone (or 390px emulation in Safari and Chrome): the resume pages show, no empty frame                                          | AC-8                       |
| At 320px in EN and PL: no sideways scroll, toolbar on one row, icon only edit link and Download with names                                | AC-4, AC-6, AC-7           |
| Throttle the CPU and reload: a blank paper sheet and "Preparing preview" show, then the pages land with no jump                           | AC-10                      |
| In DevTools Network, filter for `react-pdf`: no main thread request while the page loads and you download                                 | AC-11, AC-19               |
| One page resume: strip says "1 page", no switch                                                                                           | AC-13, AC-14               |
| Two page resume that fits: "Checking…" then the switch appears without a shift; One page switches at once; Download saves a one page file | AC-13, AC-14, AC-17, AC-19 |
| Very long resume: strip says "Too long for one page", no switch                                                                           | AC-13                      |
| Choose One page, then switch language: back to Full size, the search runs again, the PDF is in the new language                           | AC-16, AC-18               |
| Reload: Full size is selected again                                                                                                       | AC-16                      |
| Open `/preview?templateId=nope`: the saved template shows; the edit link keeps it                                                         | AC-4, AC-21                |
| Block the worker script in DevTools and reload: the unavailable notice shows, Download still saves a PDF                                  | AC-20, AC-22               |
| Tab through toolbar and strip: visible focus, arrows move the switch, nothing is skipped                                                  | AC-27                      |
| Clear site data and open `/preview`: the empty card, both links work                                                                      | AC-25                      |
| Open `/builder` with the live preview: page count, hint and notices look as on `main`                                                     | AC-28                      |
| Run `pnpm pre-commit` and `pnpm perf:lighthouse`                                                                                          | AC-2, AC-26, AC-29         |
