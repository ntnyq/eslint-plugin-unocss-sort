import {
  isEmptyStringOrWhitespace,
  isRecord,
  isString,
  isTruthy,
} from '@ntnyq/utils'
import type { Rule } from 'eslint'
import {
  getCalleeName,
  getNodeArray,
  getPropertyName,
  getString,
  getVueAttributeName,
  isAstNode,
} from './ast'
import type { AstNode, ExpressionObjectMode, ParserServices } from './ast'
import { getClassTokens, requiresUnoAnalysis, sortClassList } from './core'
import { analyzeUnoTokens } from './engine'
import { orderOptionsSchema } from './schema'
import type { OrderOptions, RegexOption } from './types'
import { isUnoAttribute, toRegExp } from './utils'

interface UnoSettings {
  configPath?: string
}

/**
 * Read UnoCSS settings from the ESLint rule context
 *
 * @param context ESLint rule context
 * @returns UnoCSS settings when configured
 */
function getSettings(context: Rule.RuleContext): UnoSettings | undefined {
  const { unocss } = context.settings
  return isRecord(unocss) ? (unocss as UnoSettings) : undefined
}

export const ruleOrder: Rule.RuleModule = {
  /**
   * Create visitors that find and sort UnoCSS class lists
   *
   * @param context ESLint rule context
   * @returns Script and template visitors
   */
  create(context) {
    const options = (context.options[0] ?? {}) as OrderOptions
    const { sourceCode } = context
    const checkedRanges = new Set<string>()
    const unoFunctionNames = (
      options.unoFunctions ?? ['clsx', 'classnames']
    ).map(name => name.toLowerCase())
    const unoVariablePatterns = (
      options.unoVariables ?? ['^cls', 'classNames?$']
    ).map((option: RegexOption) => toRegExp(option, 'i'))
    const configPath = getSettings(context)?.configPath
    const shouldAnalyze = isTruthy(configPath) || requiresUnoAnalysis(options)

    /**
     * Check whether a callee name is configured as a UnoCSS helper
     *
     * @param name Dotted callee name
     * @returns Whether the callee is a configured helper
     */
    function isUnoFunction(name: string): boolean {
      const normalizedName = name.toLowerCase()
      return unoFunctionNames.some(
        candidate =>
          candidate === normalizedName ||
          normalizedName.endsWith(`.${candidate}`),
      )
    }

    /**
     * Check whether a variable name is configured to contain class values
     *
     * @param name Variable name
     * @returns Whether the variable can contain class values
     */
    function isUnoVariable(name: string): boolean {
      return unoVariablePatterns.some(pattern => {
        pattern.lastIndex = 0
        return pattern.test(name)
      })
    }

    /**
     * Sort and report one source range when its utility order is invalid
     *
     * @param node AST node associated with the range
     * @param range Source range containing the class list
     * @param input Class list to check
     */
    function reportRange(
      node: AstNode,
      range: [number, number],
      input: string,
    ): void {
      if (isEmptyStringOrWhitespace(input)) {
        return
      }

      const rangeKey = range.join(':')
      if (checkedRanges.has(rangeKey)) {
        return
      }
      checkedRanges.add(rangeKey)

      const analyses = shouldAnalyze
        ? analyzeUnoTokens(getClassTokens(input), context.filename, configPath)
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
    }

    /**
     * Check a quoted literal while excluding its quote characters
     *
     * @param node Quoted literal node
     */
    function checkQuotedNode(node: AstNode): void {
      if (!node.range) {
        return
      }

      const text = sourceCode.text.slice(node.range[0], node.range[1])
      const [quote] = text
      const hasQuotes =
        (quote === '"' || quote === "'") && text.at(-1) === quote
      const range: [number, number] = hasQuotes
        ? [node.range[0] + 1, node.range[1] - 1]
        : node.range
      const input = hasQuotes ? text.slice(1, -1) : text
      reportRange(node, range, input)
    }

    /**
     * Check the raw section of a template literal element
     *
     * @param node Template literal element
     */
    function checkTemplateElement(node: AstNode): void {
      if (!node.range || !isRecord(node.value)) {
        return
      }

      const raw = getString((node.value as { raw?: unknown }).raw)
      if (raw === undefined) {
        return
      }

      const text = sourceCode.text.slice(node.range[0], node.range[1])
      const offset = text.indexOf(raw)
      if (offset === -1) {
        return
      }

      reportRange(
        node,
        [node.range[0] + offset, node.range[0] + offset + raw.length],
        raw,
      )
    }

    /**
     * Recursively visit expressions that can contain UnoCSS class lists
     *
     * @param node Expression node to visit
     * @param objectMode Whether object keys or values contain classes
     */
    function visitClassExpression(
      node: AstNode,
      objectMode: ExpressionObjectMode = 'keys',
    ): void {
      if (node.type === 'Literal' || node.type === 'VLiteral') {
        if (isString(node.value)) {
          checkQuotedNode(node)
        }
        return
      }

      if (node.type === 'TemplateLiteral') {
        for (const quasi of getNodeArray(node.quasis)) {
          checkTemplateElement(quasi)
        }
        return
      }

      if (node.type === 'TaggedTemplateExpression' && isAstNode(node.quasi)) {
        visitClassExpression(node.quasi, objectMode)
        return
      }

      if (node.type === 'ArrayExpression') {
        for (const element of getNodeArray(node.elements)) {
          if (element.type === 'SpreadElement' && isAstNode(element.argument)) {
            visitClassExpression(element.argument, 'keys')
          } else {
            visitClassExpression(element, 'keys')
          }
        }
        return
      }

      if (node.type === 'ObjectExpression') {
        for (const property of getNodeArray(node.properties)) {
          if (
            property.type === 'SpreadElement' &&
            isAstNode(property.argument)
          ) {
            visitClassExpression(property.argument, objectMode)
          } else if (property.type === 'Property') {
            if (objectMode === 'keys' && isAstNode(property.key)) {
              visitClassExpression(property.key, 'keys')
            } else if (objectMode === 'values' && isAstNode(property.value)) {
              visitClassExpression(property.value, 'values')
            }
          }
        }
        return
      }

      if (node.type === 'ConditionalExpression') {
        if (isAstNode(node.consequent)) {
          visitClassExpression(node.consequent, objectMode)
        }
        if (isAstNode(node.alternate)) {
          visitClassExpression(node.alternate, objectMode)
        }
        return
      }

      if (node.type === 'LogicalExpression') {
        if (isAstNode(node.left)) {
          visitClassExpression(node.left, objectMode)
        }
        if (isAstNode(node.right)) {
          visitClassExpression(node.right, objectMode)
        }
        return
      }

      if (
        (node.type === 'TSAsExpression' ||
          node.type === 'TSSatisfiesExpression' ||
          node.type === 'TSNonNullExpression' ||
          node.type === 'ChainExpression') &&
        isAstNode(node.expression)
      ) {
        visitClassExpression(node.expression, objectMode)
        return
      }

      if (node.type === 'CallExpression') {
        for (const argument of getNodeArray(node.arguments)) {
          if (
            argument.type === 'SpreadElement' &&
            isAstNode(argument.argument)
          ) {
            visitClassExpression(argument.argument, 'keys')
          } else {
            visitClassExpression(argument, 'keys')
          }
        }
      }
    }

    const scriptVisitor: Rule.RuleListener = {
      /**
       * Check arguments passed to configured UnoCSS helper functions
       *
       * @param node Call expression node
       */
      CallExpression(node) {
        const candidate = node as unknown as AstNode
        if (!isAstNode(candidate.callee)) {
          return
        }

        const calleeName = getCalleeName(candidate.callee)
        if (!calleeName || !isUnoFunction(calleeName)) {
          return
        }

        visitClassExpression(candidate)
      },
      /**
       * Check JSX attributes configured to contain UnoCSS utilities
       *
       * @param node JSX attribute node
       */
      JSXAttribute(node: unknown) {
        const candidate = node as AstNode
        if (!isAstNode(candidate.name)) {
          return
        }

        const attributeName = getPropertyName(candidate.name)
        if (
          !attributeName ||
          !isUnoAttribute(attributeName, options.unoAttributes ?? []) ||
          !isAstNode(candidate.value)
        ) {
          return
        }

        const { value } = candidate
        if (
          value.type === 'JSXExpressionContainer' &&
          isAstNode(value.expression)
        ) {
          visitClassExpression(value.expression)
        } else {
          visitClassExpression(value)
        }
      },
      /**
       * Check object properties configured to contain UnoCSS utilities
       *
       * @param node Object property node
       */
      Property(node) {
        const candidate = node as unknown as AstNode
        if (!isAstNode(candidate.key) || !isAstNode(candidate.value)) {
          return
        }

        const propertyName = getPropertyName(candidate.key)
        if (
          propertyName &&
          isUnoAttribute(propertyName, options.unoAttributes ?? [])
        ) {
          visitClassExpression(candidate.value)
        }
      },
      /**
       * Check configured variables whose values contain class lists
       *
       * @param node Variable declarator node
       */
      VariableDeclarator(node) {
        const candidate = node as unknown as AstNode
        if (
          !isAstNode(candidate.id) ||
          candidate.id.type !== 'Identifier' ||
          !isAstNode(candidate.init)
        ) {
          return
        }

        const variableName = getString(candidate.id.name)
        if (variableName && isUnoVariable(variableName)) {
          visitClassExpression(candidate.init, 'values')
        }
      },
    }

    const templateVisitor = {
      /**
       * Check Vue attributes configured to contain UnoCSS utilities
       *
       * @param node Vue attribute node
       */
      VAttribute(node: AstNode) {
        const attributeName = getVueAttributeName(node)
        if (
          !attributeName ||
          !isUnoAttribute(attributeName, options.unoAttributes ?? []) ||
          !isAstNode(node.value)
        ) {
          return
        }

        if (node.value.type === 'VLiteral') {
          checkQuotedNode(node.value)
        } else if (
          node.value.type === 'VExpressionContainer' &&
          isAstNode(node.value.expression)
        ) {
          visitClassExpression(node.value.expression)
        }
      },
    }

    const parserServices = sourceCode.parserServices as ParserServices
    return parserServices.defineTemplateBodyVisitor
      ? parserServices.defineTemplateBodyVisitor(templateVisitor, scriptVisitor)
      : scriptVisitor
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

export const rules = {
  order: ruleOrder,
}
