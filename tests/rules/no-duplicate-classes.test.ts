import { run, unindent } from 'eslint-vitest-rule-tester'
import vueParser from 'vue-eslint-parser'
import type { NoDuplicateClassesOptions } from '../../src'
import { ruleNoDuplicateClasses } from '../../src/rules'

run<NoDuplicateClassesOptions[], 'duplicateClasses'>({
  name: 'no-duplicate-classes',
  rule: ruleNoDuplicateClasses,
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  invalid: [
    {
      code: '<template><div class="flex  p-2 flex p-2" /></template>',
      errors: ['duplicateClasses'],
      filename: 'Duplicate.vue',
      output: '<template><div class="flex  p-2" /></template>',
    },
    {
      code: unindent`
        const clsRoot = 'flex p-2 flex'
        const value = clsx('text-white text-white', {
          'bg-red bg-red': active,
        })
      `,
      errors: ['duplicateClasses', 'duplicateClasses', 'duplicateClasses'],
      output: unindent`
        const clsRoot = 'flex p-2'
        const value = clsx('text-white', {
          'bg-red': active,
        })
      `,
    },
    {
      code: 'const value = tw`flex p-2 flex`',
      errors: ['duplicateClasses'],
      options: [
        {
          targets: [
            {
              kind: 'tag',
              name: '^tw$',
            },
          ],
        },
      ],
      output: 'const value = tw`flex p-2`',
    },
  ],
  valid: [
    {
      code: '<div className="flex p-2 text-white" />',
      filename: 'Valid.jsx',
    },
    {
      code: 'const value = css`flex flex`',
      options: [
        {
          targets: [
            {
              kind: 'tag',
              name: '^tw$',
            },
          ],
        },
      ],
    },
  ],
})
