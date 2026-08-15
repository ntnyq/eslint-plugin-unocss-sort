# Enforce a deterministic order for UnoCSS utilities (`unocss-sort/order`)

The `order` rule sorts UnoCSS utilities in static class lists. It is fixable and
uses a stable semantic order by default, without requiring an UnoCSS
configuration.

## Rule details

Examples of **incorrect** code for this rule:

```vue
<template>
  <div class="text-white flex p-4" />
</template>
```

```jsx
const button = <button className='hover:bg-blue-600 flex bg-blue-500' />
```

Examples of **correct** code for this rule:

```vue
<template>
  <div class="flex p-4 text-white" />
</template>
```

```jsx
const button = <button className='flex bg-blue-500 hover:bg-blue-600' />
```

Enable the rule in a flat ESLint configuration:

```ts
import unocssSort from 'eslint-plugin-unocss-sort'

export default [
  {
    plugins: {
      'unocss-sort': unocssSort,
    },
    rules: {
      'unocss-sort/order': 'warn',
    },
  },
]
```

Vue SFCs must be parsed with `vue-eslint-parser` in the consuming project. The
rule uses the parser's template visitor automatically when it is available.

## Options

The rule accepts one options object:

```ts
{
  analysis: 'auto',
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
  customGroups: [
    {
      groupName: 'icons',
      anyOf: [
        { classNamePattern: '^i-' },
        { cssPropertyPattern: '^(fill|stroke)$' },
      ],
      type: 'natural',
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
    customGroups: [
      {
        groupName: 'theme',
        variantNamePattern: '^(dark|light)$',
      },
      {
        groupName: 'state',
        variantNamePattern:
          '^(hover|focus|focus-visible|active|visited|checked|disabled)$',
      },
    ],
  },
  unknown: 'preserve-position',
  shortcuts: 'expanded',
  partitionByNewLine: true,
  whitespace: 'preserve',
}
```

`targets` is omitted above because its default is the exported
`DEFAULT_TARGETS` array. Each option is described below.

### `analysis`

Controls whether the rule loads the project's UnoCSS configuration and
analyzes utilities.

| Value      | Behavior                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `'auto'`   | The default. Analyze when `settings.unocss.configPath` is set or an explicitly configured option requires UnoCSS metadata. |
| `'always'` | Analyze every discovered class list. A discoverable UnoCSS configuration is required.                                      |
| `'never'`  | Never load UnoCSS. Options that require UnoCSS metadata cause a configuration error.                                       |

Configure an explicit UnoCSS config path through the shared UnoCSS setting:

```ts
export default [
  {
    settings: {
      unocss: {
        configPath: './uno.config.ts',
      },
    },
    rules: {
      'unocss-sort/order': 'warn',
    },
  },
]
```

Runtime analysis provides rule order, layers, generated CSS properties,
shortcuts, `meta.sort` values, and configured breakpoints. It is required by:

- `type: 'uno'`, including a group or custom-group override
- `shortcuts: 'group' | 'preserve-position'`
- an explicitly configured `variants.responsiveOrder: 'theme'`
- custom group matchers using `cssPropertyPattern`, `layer`, `recognized`, or
  `shortcut`

### `type`

Selects the default comparator used inside each utility group.

| Value            | Behavior                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| `'semantic'`     | The default. Uses stable built-in semantic ranks, then natural comparison. |
| `'uno'`          | Uses analyzed UnoCSS layer, rule order, and `meta.sort` metadata.          |
| `'natural'`      | Uses locale-aware comparison with numeric segments.                        |
| `'alphabetical'` | Uses locale-aware comparison without numeric segments.                     |
| `'code-point'`   | Compares Unicode code points.                                              |
| `'custom'`       | Uses the character order provided by `alphabet`.                           |
| `'unsorted'`     | Moves the group as a unit but preserves source order within it.            |

`type: 'uno'` is metadata-aware ordering and does not promise byte-for-byte
parity with UnoCSS's official `order` rule.

### `groups`

Defines the order of utility groups. A nested array gives multiple groups the
same rank. An object can override the comparator for one or more groups:

```ts
{
  groups: [
    'display',
    ['flex', 'grid'],
    {
      group: ['spacing', 'sizing'],
      type: 'natural',
      order: 'desc',
      fallbackSort: {
        type: 'code-point',
        order: 'asc',
      },
    },
    { group: 'known', type: 'unsorted' },
    'unknown',
  ],
}
```

Built-in group names are shown in the default options above. Groups omitted
from the array sort after configured groups.

### `customGroups`

Assigns utilities to user-defined groups before built-in classification. Put a
custom group's `groupName` in `groups` to control its position.

```ts
{
  groups: ['display', 'design-system', 'spacing', 'unknown'],
  customGroups: [
    {
      groupName: 'design-system',
      classNamePattern: '^ds-',
      type: 'natural',
    },
    {
      groupName: 'interactive-icons',
      anyOf: [
        { classNamePattern: '^i-' },
        {
          cssPropertyPattern: '^(fill|stroke)$',
          variantNamePattern: '^(hover|focus)$',
        },
      ],
    },
  ],
}
```

A matcher can use `classNamePattern`, `cssPropertyPattern`,
`variantNamePattern`, `layer`, `recognized`, `shortcut`, or `arbitrary`.
Conditions in one matcher are combined with AND. The entries of `anyOf` are
combined with OR. The first matching custom group wins.

Patterns accept either a string or a regular-expression descriptor:

```ts
{ pattern: '^ds-', flags: 'i' }
```

### `variants`

Controls how variant-prefixed utilities are ordered.

- `placement: 'grouped' | 'attached'` chooses whether variant rank or utility
  group rank is compared first.
- `groups` defines variant group order. Nested arrays share a rank.
- `responsiveOrder: 'theme' | 'source' | 'natural'` orders responsive variants
  using configured or built-in breakpoints, their source position, or natural
  name comparison.
- `compoundOrder: 'outer-first' | 'inner-first'` chooses which end of a
  compound variant chain is compared first.
- `customGroups` maps variant names to group names with
  `variantNamePattern`.

```ts
{
  variants: {
    placement: 'attached',
    groups: ['base', 'responsive', ['group', 'peer'], 'hocus', 'unknown'],
    responsiveOrder: 'natural',
    compoundOrder: 'inner-first',
    customGroups: [
      {
        groupName: 'hocus',
        variantNamePattern: '^(hover|focus)$',
      },
    ],
  },
}
```

### Unknown utilities and shortcuts

`unknown` controls utilities that neither semantic classification nor UnoCSS
analysis recognizes:

- `'preserve-position'` (default) pins each unknown utility in place. Sorting
  happens independently on either side of it.
- `'group'` lets unknown utilities move into the `unknown` group.

`shortcuts` controls shortcuts detected by UnoCSS analysis:

- `'expanded'` (default) classifies a shortcut by its generated CSS
  properties.
- `'preserve-position'` pins shortcuts in place.
- `'group'` places shortcuts in the `shortcut` group.

### Comparison options

- `order: 'asc' | 'desc'` sets the default direction inside groups. It does not
  reverse the `groups` array.
- `fallbackSort` sets the secondary comparator. Its `type` supports `natural`,
  `alphabetical`, `code-point`, `custom`, and `unsorted`.
- `ignoreCase` controls case sensitivity for string comparators.
- `specialCharacters: 'keep' | 'trim' | 'remove'` controls whether leading or
  all non-alphanumeric characters participate in string comparison.
- `locales` accepts a locale string or array for collation-based comparators.
- `alphabet` defines character rank for `type: 'custom'`.

Tied comparisons fall back to code-point order and then original position,
producing deterministic results.

### Whitespace and partitions

- `partitionByNewLine: true` (default) sorts every line independently. Set it
  to `false` to allow utilities to move across line boundaries.
- `whitespace: 'preserve'` (default) keeps existing whitespace slots when a
  partition is reordered.
- `whitespace: 'collapse'` rebuilds a sorted partition with single spaces while
  preserving its leading and trailing whitespace.

UnoCSS variant-group syntax is expanded for sorting and collapsed again after
sorting when it can be parsed.

### `targets`

Both rules in this plugin use the same target selectors. The defaults inspect:

- `class`, `className`, and Vue transition class attributes or object
  properties
- all arguments of `clsx` and `classnames` calls
- variables whose names start with `cls` or end with `class`/`className`

The rule supports static strings in JavaScript, JSX, Vue templates, arrays,
object class maps, conditional and logical expressions, nested calls, and
individual static template-literal segments.

Providing `targets` replaces the defaults. Spread `DEFAULT_TARGETS` to extend
them:

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

Selector fields:

| Field       | Description                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`      | Source type: `'attribute'`, `'callee'`, `'tag'`, or `'variable'`.                                                                                     |
| `name`      | Name pattern as a string or `{ pattern, flags }`. Attribute names are also matched in normalized kebab case.                                          |
| `arguments` | Callee-only selection: `'all'`, `'first'`, `'last'`, or an integer. Negative indexes count from the end.                                              |
| `match`     | Locations to collect. Defaults to `['strings']`; object matchers select `'object-keys'` or `'object-values'` and can restrict a static object `path`. |

Only statically identifiable string content is changed. Separate template
segments, conditional branches, and function arguments are sorted
independently.

## When not to use it

Do not enable this rule if another formatter owns class order, or if the project
needs exact parity with an ordering protocol not represented by the configured
sort type.
