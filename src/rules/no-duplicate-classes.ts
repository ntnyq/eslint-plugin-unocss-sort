import type { Rule } from 'eslint'
import { removeDuplicateClasses } from '../duplicates'
import { noDuplicateClassesOptionsSchema } from '../schema'
import { resolveTargets } from '../targets'
import type { NoDuplicateClassesOptions } from '../types'
import { createClassListVisitors } from '../visitors'

export const ruleNoDuplicateClasses: Rule.RuleModule = {
  create(context) {
    const options = (context.options[0] ?? {}) as NoDuplicateClassesOptions

    return createClassListVisitors(
      context,
      resolveTargets(options.targets),
      ({ input, node, range }) => {
        const { duplicates, output } = removeDuplicateClasses(input)
        if (duplicates.length === 0) {
          return
        }

        context.report({
          data: { duplicates: duplicates.join(', ') },
          fix: fixer => fixer.replaceTextRange(range, output),
          messageId: 'duplicateClasses',
          node,
        })
      },
    )
  },
  meta: {
    docs: {
      description: 'Disallow duplicate UnoCSS utilities in static class lists',
      url: 'https://github.com/ntnyq/eslint-plugin-unocss-sort#no-duplicate-classes',
    },
    fixable: 'code',
    messages: {
      duplicateClasses:
        'Unexpected duplicate UnoCSS utilities: {{duplicates}}.',
    },
    schema: [noDuplicateClassesOptionsSchema],
    type: 'suggestion',
  },
}
