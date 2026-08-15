import { run, unindent } from 'eslint-vitest-rule-tester'
import vueParser from 'vue-eslint-parser'
import { DEFAULT_TARGETS } from '../src'
import type { OrderOptions, TargetSelector } from '../src'
import { ruleOrder } from '../src/rules'

const cxTarget = {
  arguments: 'all',
  kind: 'callee',
  match: ['strings', { type: 'object-keys' }],
  name: '(?:^|\\.)cx$',
} satisfies TargetSelector

const uiClassTarget = {
  kind: 'attribute',
  match: ['strings', { type: 'object-keys' }],
  name: '^ui-class$',
} satisfies TargetSelector

run<OrderOptions[], 'invalidOrder'>({
  name: 'order',
  rule: ruleOrder,
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  invalid: [
    {
      code: unindent`
        <template>
          <Transition
            appear-active-class="text-white flex duration-200"
            leave-to-class="opacity-0 absolute"
          />
          <div class="text-white flex p-4" />
        </template>
      `,
      errors: ['invalidOrder', 'invalidOrder', 'invalidOrder'],
      filename: 'Component.vue',
      output: unindent`
        <template>
          <Transition
            appear-active-class="flex text-white duration-200"
            leave-to-class="absolute opacity-0"
          />
          <div class="flex p-4 text-white" />
        </template>
      `,
    },
    {
      code: unindent`
        <template>
          <div
            :class="['text-white flex', { 'bg-red p-2': active }, active ? 'opacity-0 absolute' : 'm-2 block']"
          />
          <Transition :appear-to-class="'opacity-0 absolute'" />
        </template>
      `,
      errors: [
        'invalidOrder',
        'invalidOrder',
        'invalidOrder',
        'invalidOrder',
        'invalidOrder',
      ],
      filename: 'Bindings.vue',
      output: unindent`
        <template>
          <div
            :class="['flex text-white', { 'p-2 bg-red': active }, active ? 'absolute opacity-0' : 'block m-2']"
          />
          <Transition :appear-to-class="'absolute opacity-0'" />
        </template>
      `,
    },
    {
      code: '<template><Widget ui-class="text-white flex" /></template>',
      errors: ['invalidOrder'],
      filename: 'Custom.vue',
      options: [{ targets: [uiClassTarget] }],
      output: '<template><Widget ui-class="flex text-white" /></template>',
    },
    {
      code: unindent`
        const clsButton = 'text-white flex'
        const classNames = { root: 'bg-red p-2' }
        const value = styles.cx('text-white flex', { 'bg-red p-2': active })
        const props = { appearActiveClass: 'duration-200 flex' }
      `,
      errors: [
        'invalidOrder',
        'invalidOrder',
        'invalidOrder',
        'invalidOrder',
        'invalidOrder',
      ],
      options: [{ targets: [...DEFAULT_TARGETS, cxTarget] }],
      output: unindent`
        const clsButton = 'flex text-white'
        const classNames = { root: 'p-2 bg-red' }
        const value = styles.cx('flex text-white', { 'p-2 bg-red': active })
        const props = { appearActiveClass: 'flex duration-200' }
      `,
    },
    {
      code: unindent`
        const view = (
          <div
            className="text-white flex"
            uiClass={active ? 'bg-red p-2' : 'opacity-0 absolute'}
          />
        )
      `,
      errors: ['invalidOrder', 'invalidOrder', 'invalidOrder'],
      filename: 'Component.jsx',
      options: [{ targets: [...DEFAULT_TARGETS, uiClassTarget] }],
      output: unindent`
        const view = (
          <div
            className="flex text-white"
            uiClass={active ? 'p-2 bg-red' : 'absolute opacity-0'}
          />
        )
      `,
    },
    {
      code: unindent`
        const clsRoot = tw\`text-white flex \${active} bg-red p-2\`
        const value = cx(
          ['opacity-0 absolute', ...extra],
          condition && 'm-2 block',
        )
      `,
      errors: ['invalidOrder', 'invalidOrder', 'invalidOrder', 'invalidOrder'],
      options: [
        {
          targets: [
            cxTarget,
            {
              kind: 'variable',
              match: ['strings', { type: 'object-values' }],
              name: '^clsRoot$',
            },
          ],
        },
      ],
      output: unindent`
        const clsRoot = tw\`flex text-white \${active} p-2 bg-red\`
        const value = cx(
          ['absolute opacity-0', ...extra],
          condition && 'block m-2',
        )
      `,
    },
    {
      code: unindent`
        const value = clsx(
          make('text-white flex'),
          ...['bg-red p-2'],
          { ...{ 'opacity-0 absolute': active } },
        )
      `,
      errors: ['invalidOrder', 'invalidOrder', 'invalidOrder'],
      output: unindent`
        const value = clsx(
          make('flex text-white'),
          ...['p-2 bg-red'],
          { ...{ 'absolute opacity-0': active } },
        )
      `,
    },
    {
      code: unindent`
        const value = styles['cx']('text-white flex')
        const props = { ['class']: 'bg-red p-2' }
      `,
      errors: ['invalidOrder', 'invalidOrder'],
      options: [{ targets: [...DEFAULT_TARGETS, cxTarget] }],
      output: unindent`
        const value = styles['cx']('flex text-white')
        const props = { ['class']: 'p-2 bg-red' }
      `,
    },
    {
      code: unindent`
        const tagged = tw\`text-white flex \${active} bg-red p-2\`
        const untouched = css\`text-white flex\`
      `,
      errors: ['invalidOrder', 'invalidOrder'],
      options: [{ targets: [{ kind: 'tag', name: '^tw$' }] }],
      output: unindent`
        const tagged = tw\`flex text-white \${active} p-2 bg-red\`
        const untouched = css\`text-white flex\`
      `,
    },
    {
      code: "const value = cva('text-white flex', 'bg-red p-2')",
      errors: ['invalidOrder'],
      options: [
        {
          targets: [{ arguments: 'last', kind: 'callee', name: '^cva$' }],
        },
      ],
      output: "const value = cva('text-white flex', 'p-2 bg-red')",
    },
    {
      code: unindent`
        const value = cva({
          variants: { size: { sm: 'text-white flex' } },
          defaultVariants: { size: 'text-white flex' },
          compoundVariants: [{ class: 'bg-red p-2' }],
        })
      `,
      errors: ['invalidOrder', 'invalidOrder'],
      options: [
        {
          targets: [
            {
              kind: 'callee',
              match: [
                {
                  path: '^(?:variants\\..+|compoundVariants\\[\\d+\\]\\.class)$',
                  type: 'object-values',
                },
              ],
              name: '^cva$',
            },
          ],
        },
      ],
      output: unindent`
        const value = cva({
          variants: { size: { sm: 'flex text-white' } },
          defaultVariants: { size: 'text-white flex' },
          compoundVariants: [{ class: 'p-2 bg-red' }],
        })
      `,
    },
  ],
  valid: [
    {
      code: '<template><div class="flex p-4 text-white" /></template>',
      filename: 'Valid.vue',
    },
    {
      code: unindent`
        const styles = 'text-white flex'
        const value = clsx('bg-red p-2')
      `,
      options: [
        {
          targets: [
            { kind: 'callee', name: '^cx$' },
            {
              kind: 'variable',
              match: ['strings', { type: 'object-values' }],
              name: '^tokens$',
            },
          ],
        },
      ],
    },
    {
      code: '<div data-class="text-white flex" />',
      filename: 'Ignored.jsx',
    },
  ],
})
