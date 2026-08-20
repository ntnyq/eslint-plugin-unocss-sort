# Roadmap

This document prioritizes work that is intentionally outside the current
implementation. Priorities reflect correctness and interface stability first,
ecosystem coverage second, and convenience features last.

The current baseline already includes:

- stable semantic sorting, official UnoCSS ordering, and metadata-aware sorting
- versioned semantic profiles, starting with `wind3@1`
- `analysis: 'auto' | 'always' | 'never'`
- unified attribute, callee, tag, and variable target selectors
- argument selection and object key/value path matchers
- `whitespace: 'preserve' | 'collapse'`
- a separate `no-duplicate-classes` rule

## Completed protocol milestones

### 0.1.0: Explicit UnoCSS ordering modes

The ordering protocols are now explicit:

- `uno` follows the official UnoCSS `order` sorting protocol
- `uno-metadata` retains plugin groups and variants while using UnoCSS layer,
  rule order, and `meta.sort` metadata
- migration and compatibility fixtures lock both behaviors

### 0.2.0: Versioned semantic profiles

- `profile: 'wind3'` and `orderVersion: 1` identify the v0.1 semantic behavior
- the coordinate locks class and property classification, utility and variant
  defaults, responsive variants, and built-in custom groups
- observable compatibility fixtures preserve the v0.1 output
- old profile versions remain available for at least one major release after a
  replacement is introduced

Future `wind4` or `property` profiles must be introduced as new coordinates;
they must not modify `wind3@1`.

### 0.3.0: Configured syntax conventions

- resolved preset prefixes are removed before semantic classification without
  changing fixed token text
- resolved variant separators drive token parsing and variant-group expansion
- arbitrary variants, quoted bracket values, escapes, and default semantic
  fallback behavior remain compatible

## P0: Compatibility hardening

### Expand invariant and compatibility fixtures

Keep the public sorting interface covered by observable behavior rather than
implementation details.

Ongoing coverage:

- official UnoCSS parity fixtures for the official mode
- semantic profile compatibility and upgrade fixtures
- unknown utilities and shortcuts at every partition position
- custom layers, multiple generated properties, `meta.sort`, custom
  breakpoints, and invalid configs
- ESLint 9 and 10 package smoke tests for every exported rule

## P1: High-value ecosystem coverage

### Add language adapters at the target visitor seam

Add first-class parsing support in this order:

1. Svelte
2. Astro
3. Angular and standalone HTML templates
4. framework-specific embedded expression syntaxes

Each adapter should emit the same internal class-list range shape used by the
JavaScript, JSX, and Vue visitors. Sorting and duplicate detection must not gain
language-specific branches.

### Add Attributify support

Implement a separate `order-attributify` rule for ordering Attributify
attributes. Do not treat Attributify attribute values as ordinary class lists;
the two syntaxes have different extraction and ordering rules.

### Extend target selectors only for demonstrated syntax

Potential additions:

- curried call selection (`targetCall`)
- anonymous function return matchers
- separate terminal-name and full-member-path matching
- reusable exported target presets for popular helpers such as `cva`, `tv`,
  `cn`, and `tw`

Add each capability with real fixtures. Avoid a global `ignoredKeys` blacklist;
positive object path matchers are safer for autofix and compose better with
nested configuration objects.

### Ship explicit preset configs

Candidate flat configs:

- `recommended`
- `semantic`
- `uno`

Presets should remain small and make rule severity and analysis requirements
obvious. They must not silently opt users into config-dependent sorting.

## P2: Focused rules and formatter ergonomics

### Sort CSS `@apply`

Support style-sheet parsers only after quoting, escaping, preprocessors, and
fix ranges are covered by fixtures. Reuse the sorting core; keep CSS traversal
in an adapter.

### Add a separate class-list layout rule

Long class-list wrapping does not belong in `order`. If demand is demonstrated,
add a dedicated layout rule for:

- print-width-aware wrapping
- first/last token placement
- indentation and line-ending policies

Syntax transformations must be opt-in and idempotent. They should never be a
side effect of sorting.

### Consider additional correctness rules

Evaluate separate rules for:

- unknown utilities
- conflicting utilities
- restricted or deprecated utilities
- unnecessary arbitrary values

These require stronger guarantees from UnoCSS analysis than ordering does.
They should not be implemented as more options on `order`.

### Batch UnoCSS analysis per file

The generator is cached, but class-list ranges currently cross the synchronous
worker seam independently. If profiling shows the bridge is material, collect
tokens per file and analyze them in one request before reporting fixes.

## Explicit non-goals

- Do not add `unknownClassPosition` or `unknownClassOrder`; existing groups,
  group-local comparators, and the `unknown` policy already express them.
- Do not add a global `ignoredKeys`; use positive object path matchers.
- Do not add `onConfigNotFound`; `analysis` already defines whether a config is
  optional, required, or forbidden.
- Do not combine duplicate removal or class-list wrapping with `order`.
- Do not promise CommonJS output unless a concrete consumer requirement
  outweighs the cost of a second package format.
