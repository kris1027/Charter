<div align="center">

# Charter

A modern, intuitive resume builder with multiple templates, dark mode, i18n, and PDF export.

[Try the live app](https://cv-builder-five-eosin.vercel.app/) · [Development project](https://github.com/users/kris1027/projects/3)

[![React][React-badge]][React-url]
[![TypeScript][TypeScript-badge]][TypeScript-url]
[![Vite][Vite-badge]][Vite-url]
[![TailwindCSS][Tailwind-badge]][Tailwind-url]

</div>

## Table of Contents

- [Features](#features)
- [Template Previews](#template-previews)
- [Built With](#built-with)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [Templates](#templates)
- [Project Structure](#project-structure)
- [License](#license)
- [Support](#support)

## Features

- **3 Professional Templates** — Developer, Default, and Veterinary with unique fonts, colors, and layouts
- **Bilingual (PL/EN)** — Full Polish and English language support with one-click toggle
- **Dark Mode** — Light, Dark, and System theme options
- **Smooth Animations** — Scroll-linked parallax on decorative layers + scroll-triggered entrance animations via Motion (Framer Motion)
- **PDF Export & Import** — Download your CV as PDF, or import a previously exported PDF to continue editing
- **GDPR Consent Clause** — Optional GDPR/RODO consent text with or without a company name
- **Drag & Drop Reordering** — Reorder experience, education, skills, languages, and interests sections
- **Data Persistence** — Auto-save to localStorage with manual save and backup
- **Single/Multi-Page Mode** — Preview CV in paginated or fit-to-one-page layout
- **Accessible** — Animations respect `prefers-reduced-motion`, keyboard-navigable
- **PWA Support** — Install as a native app, offline support, auto-updates
- **SEO Optimized** — Open Graph, Twitter Cards, JSON-LD structured data, sitemap
- **Real-time Validation** — Zod schema validation with i18n error messages
- **No Sign-up Required** — Start building immediately, 100% free

## Template Previews

These sample resumes show the Default and Developer templates with fictional data. The builder also includes a Veterinary template.

| Default                                                                                                                     | Developer                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ![Default resume template preview with sample experience, education, and skills](src/assets/templates/default-template.png) | ![Developer resume template preview with sample experience, education, and skills](src/assets/templates/developer-template.png) |

## Built With

### Core

- [React 19](https://react.dev/) — UI library
- [TypeScript](https://www.typescriptlang.org/) (strict mode) — Type-safe JavaScript
- [Vite](https://vite.dev/) — Build tool and dev server
- [TanStack Router](https://tanstack.com/router) — Type-safe routing with View Transition API support
- [TanStack Form](https://tanstack.com/form) — Form state management
- [Zod](https://zod.dev/) — Schema validation

### UI & Styling

- [Tailwind CSS v4](https://tailwindcss.com/) — Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) — Accessible, unstyled UI primitives
- [shadcn/ui](https://ui.shadcn.com/) — Pre-built UI components
- [Lucide React](https://lucide.dev/) — Icon library
- [dnd-kit](https://dndkit.com/) — Drag and drop toolkit

### Dev Tools

- [Prettier](https://prettier.io/) — Code formatting with Tailwind CSS class sorting
- [ESLint](https://eslint.org/) — Linting with TypeScript and React plugins
- [Vitest](https://vitest.dev/) — Unit and component testing
- [React Testing Library](https://testing-library.com/react) — Component testing utilities
- [GitHub Actions](https://github.com/features/actions) — CI pipeline (format check, lint, test, build)
- [Dependabot](https://docs.github.com/en/code-security/dependabot) — Automated dependency updates

### Additional Libraries

- [react-i18next](https://react.i18next.com/) — Internationalization (PL + EN)
- [pdfjs-dist](https://mozilla.github.io/pdf.js/) — PDF parsing for import
- [@react-pdf/renderer](https://react-pdf.org/) — Text-based, ATS-readable PDF export with custom fonts
- [Motion](https://motion.dev/) — Scroll-linked parallax and whileInView entrance animations
- [DOMPurify](https://github.com/cure53/DOMPurify) — HTML sanitization
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + [Workbox](https://developer.chrome.com/docs/workbox/) — Progressive Web App support

## Getting Started

### Prerequisites

- Node.js 24+ (see `.nvmrc` for pinned version)
- pnpm 12+ (pinned via `packageManager` in `package.json`)

### Installation

```bash
git clone https://github.com/Kris1027/Charter.git
cd Charter
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable        | Description                          | Default                 |
| --------------- | ------------------------------------ | ----------------------- |
| `VITE_SITE_URL` | Base site URL (used for SEO/OG tags) | `http://localhost:5173` |

### Available Scripts

| Script               | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `pnpm dev`           | Start development server                             |
| `pnpm build`         | Build for production (TypeScript check + Vite build) |
| `pnpm preview`       | Preview production build                             |
| `pnpm lint`          | Run ESLint                                           |
| `pnpm format`        | Format all files with Prettier                       |
| `pnpm format:check`  | Check formatting (used in CI)                        |
| `pnpm test`          | Run all tests once                                   |
| `pnpm test:watch`    | Run tests in watch mode                              |
| `pnpm test:coverage` | Run tests with coverage report                       |

## How It Works

1. **Choose a Template** — Pick from Developer, Default, or Veterinary templates
2. **Fill in Your Details** — Personal info, work experience, education, skills, languages, interests, and optional GDPR consent
3. **Preview Your CV** — View in multi-page or single-page mode
4. **Export as PDF** — Download with embedded metadata for future re-import

## Templates

| Template   | Font                | Color Scheme | Audience           |
| ---------- | ------------------- | ------------ | ------------------ |
| Developer  | Fira Code           | Purple/green | Tech professionals |
| Default    | Montserrat          | Gray         | All industries     |
| Veterinary | Lato + Merriweather | Emerald/teal | Animal healthcare  |

## Project Structure

```
src/
├── app/                   # App shell: root layout, privacy notice, PWA prompts, offline banner
├── features/
│   ├── landing/           # Landing page
│   ├── gallery/           # Template gallery, detail page and preview cards
│   ├── builder/           # Builder page and form sections
│   ├── preview/           # Preview page (one page fit)
│   ├── templates/         # Resume templates: html/ (gallery cards) and pdf/ (preview, export)
│   ├── pdf/               # PDF export and import
│   └── resume/            # Resume schema, form types, sample data, stored resume, metadata
├── components/            # Shared components (theme, language, decorative layers)
│   └── ui/                # Reusable UI components (shadcn/ui)
├── hooks/                 # Shared hooks (use-theme, use-parallax)
├── lib/                   # Shared utilities (storage, seo, dates, template ids, helpers)
├── i18n/                  # i18n configuration
├── locales/               # Translation files (en/, pl/)
├── routes/                # TanStack Router route definitions
├── test/                  # Test setup and utilities
└── assets/                # Images
```

Imports point one way: pages (`landing`, `gallery`, `builder`, `preview`), then `pdf`, `templates`, `resume`, then shared code. `pnpm lint` enforces it (spec 0002).

## License

Copyright (c) 2026 Kris1027. All rights reserved.

This project is provided for viewing and reference purposes only. No permission is granted to copy, modify, distribute, or use this software for any purpose without explicit written consent from the author.

## Support

For issues, questions, or suggestions, please [open an issue on GitHub](https://github.com/Kris1027/Charter/issues).

<!-- Tech Badges -->

[React-badge]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[TypeScript-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Vite-badge]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vite.dev/
[Tailwind-badge]: https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
