# eslint-plugin-unocss-sort

[![CI](https://github.com/ntnyq/eslint-plugin-unocss-sort/workflows/CI/badge.svg)](https://github.com/ntnyq/eslint-plugin-unocss-sort/actions)
[![NPM VERSION](https://img.shields.io/npm/v/eslint-plugin-unocss-sort.svg)](https://www.npmjs.com/package/eslint-plugin-unocss-sort)
[![NPM DOWNLOADS](https://img.shields.io/npm/dy/eslint-plugin-unocss-sort.svg)](https://www.npmjs.com/package/eslint-plugin-unocss-sort)
[![LICENSE](https://img.shields.io/github/license/ntnyq/eslint-plugin-unocss-sort.svg)](https://github.com/ntnyq/eslint-plugin-unocss-sort/blob/main/LICENSE)

Deterministic, configurable UnoCSS utility sorting for ESLint.

Unlike sorter implementations that expose UnoCSS's internal rule index as the formatting protocol, the default `semantic` mode uses stable semantic groups. UnoCSS can still analyze project rules and shortcuts when a config path is provided.

## Install

```shell
pnpm add -D eslint eslint-plugin-unocss-sort
```

## Configure

The plugin exposes focused ordering and duplicate-class rules and intentionally ships no preset configs. Configure them directly:

```ts
import unocssSort from 'eslint-plugin-unocss-sort'

export default [
  {
    plugins: {
      'unocss-sort': unocssSort,
    },
    rules: {
      'unocss-sort/no-duplicate-classes': 'warn',
      'unocss-sort/order': [
        'warn',
        {
          type: 'semantic',
          groups: [
            'layout',
            'position',
            'display',
            ['flex', 'grid', 'alignment'],
            'spacing',
            'sizing',
            'typography',
            ['background', 'border'],
            ['effects', 'filters'],
            ['transform', 'transition', 'animation'],
            'interactivity',
            'icons',
            ['svg', 'accessibility'],
            'arbitrary-property',
            'shortcut',
            'known',
            'unknown',
          ],
          unknown: 'preserve-position',
        },
      ],
    },
  },
]
```

Vue SFCs must be parsed with `vue-eslint-parser` in the consuming project. The plugin uses its template visitor automatically when available.

## Vue support

The rule handles static attributes, bound expressions, arrays, object class maps, conditionals, logical expressions, and template literal partitions.

Built-in attribute and property targets include:

- `class` and `className`
- `enter-class`, `enter-from-class`, `enter-active-class`, `enter-to-class`
- `leave-class`, `leave-from-class`, `leave-active-class`, `leave-to-class`
- `appear-class`, `appear-from-class`, `appear-active-class`, `appear-to-class`
- `move-class` for `<TransitionGroup>`

Kebab-case and camelCase forms are both recognized. The same names are supported in Vue templates, JSX, and JavaScript object properties.

## Target selectors

The default targets cover built-in class attributes, `clsx` and `classnames`
calls, and variables matching `^cls` or `classNames?$`. Add or replace source
locations with the unified `targets` selectors:

```ts
import { DEFAULT_TARGETS } from 'eslint-plugin-unocss-sort'

{
  targets: [
    ...DEFAULT_TARGETS,
    {
      kind: 'attribute',
      name: '^ui-class$',
      match: ['strings', { type: 'object-keys' }],
    },
    {
      kind: 'callee',
      name: '^(?:cva|tv)$',
      arguments: 'all',
      match: [
        'strings',
        {
          type: 'object-values',
          path: '^(?:variants\\..+|compoundVariants\\[\\d+\\]\\.(?:class|className))$',
        },
      ],
    },
    { kind: 'tag', name: '^tw$' },
    {
      kind: 'variable',
      name: '^styles$',
      match: ['strings', { type: 'object-values' }],
    },
  ],
}
```

`targets` replaces the defaults. Spread `DEFAULT_TARGETS` when extending them.
Every selector uses a string or `{ pattern, flags }` regular expression.
Attribute names are also matched in normalized kebab case, so `uiClass` matches
`^ui-class$`.

- `kind: 'attribute'` covers Vue, JSX, and JavaScript object properties.
- `kind: 'callee'` supports dotted member names and `arguments: 'all' | 'first' | 'last' | number`. Negative indexes count from the end.
- `kind: 'tag'` covers tagged template literals, including member tags.
- `kind: 'variable'` covers variable initializers.
- `match` defaults to `['strings']`. Object matchers can collect keys or values and optionally restrict them with a static object `path` pattern.

Positive object paths are preferred to broad traversal plus ignored-key lists,
because they keep autofixes limited to known class-bearing fields.

## Perfectionist-style options

The main configuration layers are utility groups, group-local comparators, variant order, and special-node policies:

```ts
{
  type: 'semantic',
  order: 'asc',
  fallbackSort: {
    type: 'code-point',
    order: 'asc',
  },

  ignoreCase: false,
  specialCharacters: 'keep',
  locales: 'en-US',
  alphabet: '',

  groups: [
    'display',
    ['flex', 'grid'],
    {
      group: 'spacing',
      type: 'semantic',
      fallbackSort: { type: 'code-point' },
    },
    { group: 'known', type: 'unsorted' },
    'unknown',
  ],

  customGroups: [
    {
      groupName: 'design-system',
      classNamePattern: '^ds-',
      type: 'natural',
    },
    {
      groupName: 'icons',
      anyOf: [
        { classNamePattern: '^i-' },
        { cssPropertyPattern: '^(fill|stroke)$' },
      ],
    },
  ],

  variants: {
    placement: 'grouped',
    groups: [
      'base',
      'theme',
      'responsive',
      'container',
      ['group', 'peer'],
      'state',
      'pseudo-element',
      'at-rule',
      'arbitrary',
      'unknown',
    ],
    responsiveOrder: 'theme',
    compoundOrder: 'outer-first',
  },

  unknown: 'preserve-position',
  shortcuts: 'expanded',
  partitionByNewLine: true,
  whitespace: 'preserve',
}
```

Available sort types are `semantic`, `uno`, `natural`, `alphabetical`, `code-point`, `custom`, and `unsorted`.

- `semantic` is the stable default.
- `uno` uses the configured generator's layer, rule order, and `meta.sort` metadata.
- `unsorted` moves groups but preserves their internal source order.
- Every comparator falls back to deterministic code-point order and then original position.

`unknown: 'preserve-position'` treats an unknown class as a pinned node, so recognized utilities do not unexpectedly cross project component classes.

`whitespace: 'preserve'` is the default and retains the whitespace slots between
tokens while changing their order. Use `whitespace: 'collapse'` to rebuild each
sorted partition with single spaces. `partitionByNewLine` independently controls
whether utilities may move across line boundaries.

## UnoCSS config analysis

Provide the same setting used by the official UnoCSS ESLint integration:

```ts
{
  settings: {
    unocss: {
      configPath: './uno.config.ts',
    },
  },
}
```

With a config path, the rule analyzes all generated outputs for recognized utilities, shortcuts, CSS properties, layers, and native order metadata. The analyzer runs in a synchronous worker suitable for ESLint and reloads when config source mtimes change.

The `analysis` option controls when that worker is used:

- `auto` (default) analyzes when `configPath` is set or an explicitly configured option requires UnoCSS metadata.
- `always` analyzes every discovered class list and requires a discoverable config.
- `never` guarantees pure semantic sorting without loading UnoCSS. Combining it with metadata-dependent options is a configuration error.

`type: 'uno'` requires a discoverable UnoCSS config. Default `semantic` sorting works without one.

## Duplicate classes

Enable `unocss-sort/no-duplicate-classes` to report and fix exact duplicate
tokens inside the same static string or template segment. The rule uses the same
default targets and accepts the same `targets` option:

```ts
{
  rules: {
    'unocss-sort/no-duplicate-classes': 'warn',
  },
}
```

It does not infer duplicates across template interpolations, conditional
branches, or separate function arguments.

## Roadmap

See [docs/roadmap.md](./docs/roadmap.md) for prioritized work that is intentionally
outside the current release scope.

## License

[MIT](./LICENSE) License © 2026-PRESENT [ntnyq](https://github.com/ntnyq)
