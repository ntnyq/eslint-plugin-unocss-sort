# Roadmap

This document prioritizes work that is intentionally outside the current
implementation. Priorities reflect correctness and interface stability first,
ecosystem coverage second, and convenience features last.

The current baseline already includes:

- stable semantic sorting and UnoCSS metadata-aware sorting
- `analysis: 'auto' | 'always' | 'never'`
- unified attribute, callee, tag, and variable target selectors
- argument selection and object key/value path matchers
- `whitespace: 'preserve' | 'collapse'`
- a separate `no-duplicate-classes` rule

## P0: Ordering protocol before a stable release

### Define exact UnoCSS ordering modes

The current `type: 'uno'` comparator combines plugin variant ordering with
UnoCSS layer, rule order, and `meta.sort` metadata. It does not promise byte-for-
byte parity with the official UnoCSS `order` rule.

Plan:

- either rename the current behavior to `uno-metadata` and add `uno-official`
- or change `uno` to exact official behavior and offer the enhanced behavior
  under a new name
- add migration fixtures that compare both modes against the official sorter

This must be settled before users persist an ordering protocol across a large
repository.

### Version semantic ordering profiles

The built-in semantic patterns are currently implementation details. Changing
them in a dependency update could create a repository-wide formatting diff.

Plan:

- introduce profiles such as `wind3`, `wind4`, and `property`
- expose an explicit `orderVersion`
- document which plugin releases may add groups without changing a locked
  version
- keep old versions available for at least one major release after replacement

### Expand invariant and compatibility fixtures

Keep the public sorting interface covered by observable behavior rather than
implementation details.

Required coverage:

- official UnoCSS parity fixtures for the official mode
- semantic profile snapshots and upgrade fixtures
- unknown utilities and shortcuts at every partition position
- custom layers, multiple generated properties, `meta.sort`, custom
  breakpoints, and invalid configs
- ESLint 9 and 10 package smoke tests for every exported rule

## P1: High-value ecosystem coverage

### Read syntax conventions from UnoCSS configuration

Derive supported prefixes, variant separators, and related syntax conventions
from the loaded UnoCSS setup where possible. Avoid accumulating rule-specific
manual exceptions in the tokenizer.

Acceptance criteria:

- custom prefixes do not change semantic classification incorrectly
- configured separators are parsed without breaking arbitrary variants or
  quoted bracket syntax
- pure semantic mode remains deterministic without a config

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
