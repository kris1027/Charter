# Contributing to Resume Builder

## Prerequisites

- [Node.js](https://nodejs.org/) (v24+, see `.nvmrc`)
- [pnpm](https://pnpm.io/) (v12+, pinned via `packageManager` in `package.json`)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Kris1027/resume-builder.git
cd resume-builder

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start the development server
pnpm run dev
```

The app will be available at `http://localhost:5173/`.

## Scripts

| Command                | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `pnpm run dev`         | Start dev server                                                   |
| `pnpm run build`       | Production build                                                   |
| `pnpm run preview`     | Preview production build                                           |
| `pnpm lint`            | ESLint checks                                                      |
| `pnpm format`          | Format all files with Prettier                                     |
| `pnpm format:check`    | Check formatting (CI uses this)                                    |
| `pnpm test`            | Run all tests once                                                 |
| `pnpm test:watch`      | Run tests in watch mode                                            |
| `pnpm test:coverage`   | Run tests with coverage report                                     |
| `pnpm pre-commit`      | Format + lint + test + tsc + build + JS size check                 |
| `pnpm perf:size`       | Check per page JS size against `perf/budgets.json` (after a build) |
| `pnpm perf:lighthouse` | Build, then run Lighthouse CI locally (set `CHROME_PATH` first)    |

**Always run `pnpm pre-commit` before pushing.** CI will reject PRs that fail any of these checks.

## Code Style

- **Formatter**: Prettier (config in `.prettierrc`) — single quotes, 4-space tabs, 100 char width
- **Linter**: ESLint with TypeScript support and the React Compiler rules (`react-hooks` v7)
- **Typecheck**: `tsc -b` runs inside `pnpm build`, not `pnpm lint`
- **Tailwind**: Classes are auto-sorted by `prettier-plugin-tailwindcss`
- Run `pnpm format` before committing to avoid CI failures

### TypeScript

- Strict mode is always enabled
- Never use `any` — use `unknown` and narrow with type guards
- Prefer `type` over `interface` unless declaration merging is needed
- Use `import type` for type-only imports
- All files use kebab-case

### React

- Arrow function components with typed props
- Props type named `ComponentNameProps`
- Callback props: `on*` prefix; handlers: `handle*` prefix
- The React Compiler memoizes every component, so don't add `useMemo`, `useCallback` or `memo` only for speed
- If a component misbehaves under the compiler, opt that one out with `'use no memo'` plus a comment naming the reason; never turn the compiler off globally

## Testing

- **Framework**: Vitest + React Testing Library
- **Location**: Co-located tests — `foo.test.ts` next to `foo.ts`
- **Custom render**: Use `import { render, screen } from '@/test/test-utils'` (wraps with i18n provider)
- **Real translations**: Tests use actual EN translation files — catches missing keys
- **Pattern**: `describe` per unit, `it('should ... when ...')` names
- Test user behavior, not implementation — query by role, label, text

## i18n

- Translation files: `src/locales/en/translation.json` and `src/locales/pl/translation.json`
- All user-facing strings must use `t()` from `react-i18next`
- New strings must be added in **both** EN and PL

## CI

GitHub Actions runs on push to `main` and on pull requests targeting `main`:

1. Format check (`pnpm format:check`)
2. Lint (`pnpm lint`)
3. Test (`pnpm test`, with the React Compiler on, like the build)
4. Build (`pnpm run build`, typecheck plus compiled output)
5. JS size budgets (`pnpm perf:size`)
6. Lighthouse, in its own job after the build: five pages on mobile settings, reports kept as a workflow artifact for 14 days

## Performance budgets

Each page has a JS budget (brotli KiB of what it loads up front) in `perf/budgets.json`, plus a cap on any single chunk. `pnpm perf:size` fails when a page goes over, when a new route has no budget, or when a budget no longer matches a route. Lighthouse floors per page live at the top of `lighthouserc.cjs`; a median under 0.95 only warns.

To raise a budget, edit `perf/budgets.json` in your PR and write the new `reason` (what grew and why). An empty reason fails the check. Floors change only together with the baseline table in `docs/specs/0003-performance-budgets/rationale.md`.

To run Lighthouse locally, point `CHROME_PATH` at your Chrome, for example on macOS:

```bash
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
pnpm perf:lighthouse
```

## Pull Requests

1. Create a feature branch from `main` (e.g., `feature/add-new-template`)
2. Make your changes, keeping commits focused and descriptive
3. Run `pnpm pre-commit` and ensure it passes
4. Open a PR against `main` with a clear description of the changes
5. Ensure all CI checks pass
