# 0010. Landing page refresh: verify

Suggested checks in a real browser against `pnpm build` and `vite preview`. Skip any you have covered another way.

| Check                                                                                    | Proves                 |
| ---------------------------------------------------------------------------------------- | ---------------------- |
| At 1440px, scroll through the page in light and dark and compare with the design copy    | AC-1, AC-4, AC-6, AC-7 |
| Switch to PL: hero images and all strings change, with no raw keys                       | AC-3, AC-15            |
| Block a preview image: a blank white sheet shows, with no broken icon                    | AC-3                   |
| Scroll halfway through the hero, then Shift+Tab into its links: the links become visible | AC-5                   |
| Scroll down and back up: entered text does not replay                                    | AC-5                   |
| At 320px and 390px: nothing pins, no sideways scroll, side images are not requested      | AC-12                  |
| Emulate reduced motion at 1440px: nothing pins or moves, all steps are visible           | AC-13                  |
| Block `motion-features`: all text and buttons stay visible                               | AC-14                  |
| Network panel on `/`: all requests are same origin; no CSP errors in the console         | AC-11                  |
| Compare the head tags on `/` with `main`                                                 | AC-16                  |
| Run `pnpm perf:lighthouse` and `pnpm pre-commit`                                         | AC-10, AC-18           |
