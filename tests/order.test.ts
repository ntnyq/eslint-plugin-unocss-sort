import { run, unindent } from 'eslint-vitest-rule-tester'
import vueParser from 'vue-eslint-parser'
import type { OrderOptions } from '../src'
import { ruleOrder } from '../src/rules'

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
      options: [{ unoAttributes: ['^ui-class$'] }],
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
      options: [{ unoFunctions: ['cx'] }],
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
      options: [{ unoAttributes: ['^uiClass$'] }],
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
      options: [{ unoFunctions: ['cx'], unoVariables: ['^clsRoot$'] }],
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
      options: [{ unoFunctions: ['cx'] }],
      output: unindent`
        const value = styles['cx']('flex text-white')
        const props = { ['class']: 'p-2 bg-red' }
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
      options: [{ unoFunctions: ['cx'], unoVariables: ['^tokens$'] }],
    },
    {
      code: '<div data-class="text-white flex" />',
      filename: 'Ignored.jsx',
    },
  ],
})
