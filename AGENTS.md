# Repository Guidelines

## Project Structure & Module Organization

Production code lives in `src/`. `index.ts` defines the public package surface,
while `plugin.ts` and `meta.ts` expose the ESLint plugin metadata. Rule modules
live in `src/rules/`. Reusable class-list features live in `src/features/`, with
sorting behavior grouped in `src/features/sort/`. ESLint AST traversal,
targets, settings, and schemas live in `src/eslint/`, and the synchronous UnoCSS
bridge and analysis types live in `src/uno/`.
`src/worker.ts` remains the secondary build entry used for UnoCSS configuration
analysis. Tests mirror these domains under `tests/rules/`,
`tests/sort/`, `tests/eslint/`, and `tests/uno/`. Package-level integration and
smoke tests stay at the root of `tests/`, while `tests/fixtures/` contains
UnoCSS configs and JS, JSX, and Vue integration samples. Generated output
belongs in `dist/` and must not be committed.

## Build, Test, and Development Commands

Use the Node versions declared in `package.json` and pnpm 11.

- `pnpm install --frozen-lockfile` installs the exact locked dependencies.
- `pnpm dev` rebuilds the package in watch mode.
- `pnpm build` creates ESM and declaration outputs with tsdown.
- `pnpm test` runs the Vitest suite once.
- `pnpm test:coverage` runs tests and enforces coverage thresholds.
- `pnpm test:package` builds the package and runs its published-package smoke
  test.
- `pnpm release:check` runs formatting, linting, type checks, coverage, and the
  package smoke test; use it before opening a PR.

## Coding Style & Naming Conventions

Write strict TypeScript and ESM. Oxfmt enforces two-space indentation, LF line
endings, single quotes, no semicolons, trailing commas, and an 80-column target.
Use camelCase for functions and values, PascalCase for types, and descriptive
lowercase filenames such as `semantic-groups.test.ts`. Run `pnpm format`,
`pnpm lint`, and `pnpm typecheck` before committing. Do not hand-edit generated
`dist/` files.

## Testing Guidelines

Vitest is the primary framework; ESLint rule behavior uses
`eslint-vitest-rule-tester`. Name suites `*.test.ts` and place reusable inputs
under `tests/fixtures/`. Rule changes should include valid, invalid, and fixer
output cases where applicable. Coverage must remain at least 85% for branches
and 90% for functions, lines, and statements.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit pattern: `feat: add comparator`,
`test: cover Vue bindings`, or `chore: update tooling`. Keep each commit focused
and use an imperative, concise subject. PRs should explain the behavior change,
link relevant issues, and list verification commands. For rule changes, include
compact before/after ESLint examples; screenshots are normally unnecessary.
Commit `pnpm-lock.yaml` only when dependencies change.
