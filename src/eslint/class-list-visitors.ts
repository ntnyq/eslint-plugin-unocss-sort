/* eslint-disable max-lines */

import { isRecord, isString } from '@ntnyq/utils'
import type { Rule } from 'eslint'
import {
  getCalleeName,
  getNodeArray,
  getPropertyName,
  getString,
  getVueAttributeName,
  isAstNode,
} from './ast'
import type { AstNode, ParserServices } from './ast'
import {
  matchesTargetName,
  matchesTargetValue,
  selectTargetArguments,
} from './targets'
import type { TargetValueKind } from './targets'
import type { CalleeTargetSelector, TargetSelector } from './types'

/**
 * Static class-list text and its replaceable source range
 */
export interface ClassListLocation {
  /**
   * Class-list text without surrounding literal delimiters
   */
  input: string

  /**
   * AST node associated with the source range
   */
  node: AstNode

  /**
   * Replaceable source offsets containing only the class-list text
   */
  range: [number, number]
}

/**
 * Callback invoked for each unique class-list location
 */
type ClassListVisitor = (location: ClassListLocation) => void

/**
 * Append an array index to a static object path
 *
 * @param path Parent object path
 * @param index Array index
 * @returns Nested object path
 */
function appendArrayPath(path: string, index: number): string {
  return `${path}[${index}]`
}

/**
 * Append a property name to a static object path
 *
 * @param path Parent object path
 * @param property Property name
 * @returns Nested object path
 */
function appendPropertyPath(path: string, property: string): string {
  return path ? `${path}.${property}` : property
}

/**
 * Create ESLint visitors that collect class-list source ranges
 *
 * @param context ESLint rule context
 * @param targets Configured source targets
 * @param visit Callback for each unique class-list range
 * @returns Script and template visitors
 */
export function createClassListVisitors(
  context: Rule.RuleContext,
  targets: TargetSelector[],
  visit: ClassListVisitor,
): Rule.RuleListener {
  const { sourceCode } = context
  const checkedRanges = new Set<string>()

  /**
   * Emit one unique source range
   *
   * @param location Class-list location
   */
  function visitRange(location: ClassListLocation): void {
    const rangeKey = location.range.join(':')
    if (checkedRanges.has(rangeKey)) {
      return
    }

    checkedRanges.add(rangeKey)
    visit(location)
  }

  /**
   * Check a quoted literal while excluding its quote characters
   *
   * @param node Quoted literal node
   */
  function visitQuotedNode(node: AstNode): void {
    if (!node.range) {
      return
    }

    const text = sourceCode.text.slice(node.range[0], node.range[1])
    const [quote] = text
    const hasQuotes = (quote === '"' || quote === "'") && text.at(-1) === quote
    const range: [number, number] = hasQuotes
      ? [node.range[0] + 1, node.range[1] - 1]
      : node.range

    visitRange({
      input: hasQuotes ? text.slice(1, -1) : text,
      node,
      range,
    })
  }

  /**
   * Check the raw section of a template literal element
   *
   * @param node Template literal element
   */
  function visitTemplateElement(node: AstNode): void {
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

    visitRange({
      input: raw,
      node,
      range: [node.range[0] + offset, node.range[0] + offset + raw.length],
    })
  }

  /**
   * Recursively visit expressions below one target
   *
   * @param node Expression node
   * @param target Matched source target
   * @param valueKind Current expression location kind
   * @param path Current static object path
   */
  function visitExpression(
    node: AstNode,
    target: TargetSelector,
    valueKind: TargetValueKind = 'strings',
    path = '',
  ): void {
    if (node.type === 'Literal' || node.type === 'VLiteral') {
      if (isString(node.value) && matchesTargetValue(target, valueKind, path)) {
        visitQuotedNode(node)
      }
      return
    }

    if (node.type === 'TemplateLiteral') {
      if (matchesTargetValue(target, valueKind, path)) {
        for (const quasi of getNodeArray(node.quasis)) {
          visitTemplateElement(quasi)
        }
      }
      return
    }

    if (node.type === 'TaggedTemplateExpression' && isAstNode(node.quasi)) {
      visitExpression(node.quasi, target, valueKind, path)
      return
    }

    if (node.type === 'ArrayExpression') {
      for (const [index, element] of getNodeArray(node.elements).entries()) {
        const nestedPath = appendArrayPath(path, index)
        if (element.type === 'SpreadElement' && isAstNode(element.argument)) {
          visitExpression(element.argument, target, valueKind, nestedPath)
        } else {
          visitExpression(element, target, valueKind, nestedPath)
        }
      }
      return
    }

    if (node.type === 'ObjectExpression') {
      for (const property of getNodeArray(node.properties)) {
        if (property.type === 'SpreadElement' && isAstNode(property.argument)) {
          visitExpression(property.argument, target, valueKind, path)
        } else if (
          property.type !== 'Property' ||
          !isAstNode(property.key) ||
          !isAstNode(property.value)
        ) {
          // Ignore unsupported property nodes.
        } else {
          const propertyName = getPropertyName(property.key) ?? '*'
          const propertyPath = appendPropertyPath(path, propertyName)
          visitExpression(property.key, target, 'object-keys', propertyPath)
          visitExpression(property.value, target, 'object-values', propertyPath)
        }
      }
      return
    }

    if (node.type === 'ConditionalExpression') {
      if (isAstNode(node.consequent)) {
        visitExpression(node.consequent, target, valueKind, path)
      }
      if (isAstNode(node.alternate)) {
        visitExpression(node.alternate, target, valueKind, path)
      }
      return
    }

    if (node.type === 'LogicalExpression') {
      if (isAstNode(node.left)) {
        visitExpression(node.left, target, valueKind, path)
      }
      if (isAstNode(node.right)) {
        visitExpression(node.right, target, valueKind, path)
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
      visitExpression(node.expression, target, valueKind, path)
      return
    }

    if (node.type === 'CallExpression') {
      for (const argument of getNodeArray(node.arguments)) {
        if (argument.type === 'SpreadElement' && isAstNode(argument.argument)) {
          visitExpression(argument.argument, target, valueKind, path)
        } else {
          visitExpression(argument, target, valueKind, path)
        }
      }
    }
  }

  /**
   * Get matching selectors for a static source name
   *
   * @param kind Target kind
   * @param name Static source name
   * @returns Matching target selectors
   */
  function getTargets(
    kind: TargetSelector['kind'],
    name: string,
  ): TargetSelector[] {
    return targets.filter(
      target => target.kind === kind && matchesTargetName(target, name),
    )
  }

  const scriptVisitor: Rule.RuleListener = {
    CallExpression(node) {
      const candidate = node as unknown as AstNode
      if (!isAstNode(candidate.callee)) {
        return
      }

      const calleeName = getCalleeName(candidate.callee)
      if (!calleeName) {
        return
      }

      const callArguments = getNodeArray(candidate.arguments)
      for (const target of getTargets('callee', calleeName)) {
        for (const argument of selectTargetArguments(
          target as CalleeTargetSelector,
          callArguments,
        )) {
          if (
            argument.type === 'SpreadElement' &&
            isAstNode(argument.argument)
          ) {
            visitExpression(argument.argument, target)
          } else {
            visitExpression(argument, target)
          }
        }
      }
    },
    JSXAttribute(node: unknown) {
      const candidate = node as AstNode
      if (!isAstNode(candidate.name) || !isAstNode(candidate.value)) {
        return
      }

      const attributeName = getPropertyName(candidate.name)
      if (!attributeName) {
        return
      }

      for (const target of getTargets('attribute', attributeName)) {
        const { value } = candidate
        if (
          value.type === 'JSXExpressionContainer' &&
          isAstNode(value.expression)
        ) {
          visitExpression(value.expression, target)
        } else {
          visitExpression(value, target)
        }
      }
    },
    Property(node) {
      const candidate = node as unknown as AstNode
      if (!isAstNode(candidate.key) || !isAstNode(candidate.value)) {
        return
      }

      const propertyName = getPropertyName(candidate.key)
      if (!propertyName) {
        return
      }

      for (const target of getTargets('attribute', propertyName)) {
        visitExpression(candidate.value, target)
      }
    },
    TaggedTemplateExpression(node) {
      const candidate = node as unknown as AstNode
      if (!isAstNode(candidate.tag) || !isAstNode(candidate.quasi)) {
        return
      }

      const tagName = getCalleeName(candidate.tag)
      if (!tagName) {
        return
      }

      for (const target of getTargets('tag', tagName)) {
        visitExpression(candidate.quasi, target)
      }
    },
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
      if (!variableName) {
        return
      }

      for (const target of getTargets('variable', variableName)) {
        visitExpression(candidate.init, target)
      }
    },
  }

  const templateVisitor = {
    VAttribute(node: AstNode) {
      const attributeName = getVueAttributeName(node)
      if (!attributeName || !isAstNode(node.value)) {
        return
      }

      for (const target of getTargets('attribute', attributeName)) {
        if (node.value.type === 'VLiteral') {
          if (matchesTargetValue(target, 'strings', '')) {
            visitQuotedNode(node.value)
          }
        } else if (
          node.value.type === 'VExpressionContainer' &&
          isAstNode(node.value.expression)
        ) {
          visitExpression(node.value.expression, target)
        }
      }
    },
  }

  const parserServices = sourceCode.parserServices as ParserServices
  return parserServices.defineTemplateBodyVisitor
    ? parserServices.defineTemplateBodyVisitor(templateVisitor, scriptVisitor)
    : scriptVisitor
}
