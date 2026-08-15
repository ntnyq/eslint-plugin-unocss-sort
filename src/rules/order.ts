import { isEmptyStringOrWhitespace, isTruthy } from '@ntnyq/utils'
import type { Rule } from 'eslint'
import { createClassListVisitors } from '../eslint/class-list-visitors'
import { orderOptionsSchema } from '../eslint/schemas'
import { getSettings } from '../eslint/settings'
import { resolveTargets } from '../eslint/targets'
import type { OrderOptions } from '../eslint/types'
import {
  getClassTokens,
  requiresUnoAnalysis,
  sortClassList,
} from '../features/sort/class-list'
import { analyzeUnoTokens } from '../uno/analyze-uno-tokens'

/**
 * ESLint rule that enforces configured UnoCSS utility ordering
 */
export const ruleOrder: Rule.RuleModule = {
  create(context) {
    const options = (context.options[0] ?? {}) as OrderOptions
    const analysisMode = options.analysis ?? 'auto'
    const analysisRequired = requiresUnoAnalysis(options)
    const configPath = getSettings(context)?.configPath

    if (analysisMode === 'never' && analysisRequired) {
      throw new Error(
        '[eslint-plugin-unocss-sort] analysis: "never" cannot be used with options that require UnoCSS metadata.',
      )
    }

    const shouldAnalyze =
      analysisMode === 'always' ||
      (analysisMode === 'auto' && (isTruthy(configPath) || analysisRequired))

    return createClassListVisitors(
      context,
      resolveTargets(options.targets),
      ({ input, node, range }) => {
        if (isEmptyStringOrWhitespace(input)) {
          return
        }

        const analyses = shouldAnalyze
          ? analyzeUnoTokens(
              getClassTokens(input),
              context.filename,
              configPath,
            )
          : undefined
        const sorted = sortClassList(input, options, analyses)
        if (sorted === input) {
          return
        }

        context.report({
          data: { sorted },
          fix: fixer => fixer.replaceTextRange(range, sorted),
          messageId: 'invalidOrder',
          node,
        })
      },
    )
  },
  meta: {
    docs: {
      description:
        'Enforce a deterministic, configurable order for UnoCSS utilities',
      url: 'https://github.com/ntnyq/eslint-plugin-unocss-sort#order',
    },
    fixable: 'code',
    messages: {
      invalidOrder: 'Expected UnoCSS utilities to be ordered: {{sorted}}.',
    },
    schema: [orderOptionsSchema],
    type: 'layout',
  },
}
