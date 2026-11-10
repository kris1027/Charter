# GitHub repository setup

The repository uses the [Charter project](https://github.com/users/kris1027/projects/3) to track issues and pull requests. GitHub settings are applied directly to the repository and project; this file records the intended configuration alongside the versioned templates.

## Issue forms and labels

- Bug reports use `.github/ISSUE_TEMPLATE/bug_report.yml` and apply the existing `bug` label.
- Feature requests use `.github/ISSUE_TEMPLATE/feature_request.yml` and apply the existing `enhancement` label.
- Blank issues remain available for other work. Bug reports ask for sample or redacted resume data rather than private CV details.

## Pull requests

`.github/pull_request_template.md` asks for a summary, verification, screenshots for visual changes, and a related issue where one exists. The GitHub Actions CI workflow runs format, lint, tests, and build on pull requests to `main`.

## Repository metadata

The About description is `Build and export resumes with three templates, English/Polish support, and PDF import/export.` The topics are `cv`, `resume`, `resume-builder`, `pdf-export`, `pdf-import`, `i18n`, `pwa`, `react`, `typescript`, `tailwindcss`, and `vite`. The website points to the [live deployment](https://cv-builder-five-eosin.vercel.app/).

## Main branch rules

The `Protect main branch` ruleset targets `refs/heads/main`. It requires pull requests and the GitHub Actions `Lint, Format, Test & Build` check, with the PR branch up to date with `main`. It blocks force pushes and deletion. Required approving reviews: zero, so the solo developer can merge after CI. No bypass actors are configured.

## Project

The public project has a description and README explaining its scope and status labels. Its `On track` update describes the live app without an invented deadline. New open issues and pull requests from this repository are automatically added to the project. The `Item added to project`, `Item closed`, and `Pull request merged` workflows keep `Todo` and `Done` current.
