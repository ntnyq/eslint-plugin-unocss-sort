# Disallow duplicate UnoCSS utilities (`unocss-sort/no-duplicate-classes`)

The `no-duplicate-classes` rule reports exact duplicate tokens within each
static class-list segment. It is fixable: the first occurrence is kept and
later occurrences are removed while the surrounding source layout is
preserved.

## Rule details

Examples of **incorrect** code for this rule:

```vue
<template>
  <div class="flex p-2 flex p-2" />
</template>
```

```js
const classes = clsx('text-white text-white', {
  'bg-red bg-red': active,
})
```

Examples of **correct** code for this rule:

```vue
<template>
  <div class="flex p-2" />
</template>
```

```js
const classes = clsx('text-white', {
  'bg-red': active,
})
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
      'unocss-sort/no-duplicate-classes': 'warn',
    },
  },
]
```

Vue SFCs must be parsed with `vue-eslint-parser` in the consuming project.

## Behavior

Duplicate comparison is exact and case-sensitive. The rule does not ask
UnoCSS whether a token is recognized and does not treat different utilities
that generate the same CSS as duplicates.

Each statically identifiable string or template-literal segment is checked
independently. The rule does not infer duplicates across:

- template interpolations
- conditional or logical branches
- separate function arguments
- separate attributes, properties, or variables

For example, this code is valid because each occurrence belongs to a different
static segment or branch:

```js
const value = clsx(`flex ${active ? 'flex' : 'block'}`, enabled && 'flex')
```

## Options

The rule accepts one options object with a `targets` property:

```ts
{
  targets: [
    {
      kind: 'tag',
      name: '^tw$',
    },
  ],
}
```

`targets` selects source locations that contain class lists. Providing it
replaces the defaults. Spread `DEFAULT_TARGETS` when extending them:

```ts
import { DEFAULT_TARGETS } from 'eslint-plugin-unocss-sort'

{
  targets: [
    ...DEFAULT_TARGETS,
    { kind: 'tag', name: '^tw$' },
    {
      kind: 'callee',
      name: '^cva$',
      arguments: 'first',
      match: ['strings', { type: 'object-values', path: '^variants\\.' }],
    },
  ],
}
```

The default targets inspect:

- `class`, `className`, and Vue transition class attributes or object
  properties
- all arguments of `clsx` and `classnames` calls
- variables whose names start with `cls` or end with `class`/`className`

Selector fields:

| Field       | Description                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`      | Source type: `'attribute'`, `'callee'`, `'tag'`, or `'variable'`.                                                                                     |
| `name`      | Name pattern as a string or `{ pattern, flags }`. Attribute names are also matched in normalized kebab case.                                          |
| `arguments` | Callee-only selection: `'all'`, `'first'`, `'last'`, or an integer. Negative indexes count from the end.                                              |
| `match`     | Locations to collect. Defaults to `['strings']`; object matchers select `'object-keys'` or `'object-values'` and can restrict a static object `path`. |

See the [`order` target documentation](./order.md#targets) for a complete target
example and the supported static expression shapes.

## When not to use it

Do not enable this rule when repeated tokens are intentional or when another
tool already owns class-list deduplication.
