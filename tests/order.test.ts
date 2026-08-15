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
  ],
  valid: [
    {
      code: '<template><div class="flex p-4 text-white" /></template>',
      filename: 'Valid.vue',
    },
  ],
})
