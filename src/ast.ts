import { isArray, isRecord, isString } from '@ntnyq/utils'
import type { Rule } from 'eslint'

/**
 * Minimal source location shape shared by supported ESTree-compatible parsers
 */
interface AstLocation {
  end: { column: number; line: number }
  start: { column: number; line: number }
}

/**
 * Parser-agnostic AST node subset consumed by class-list visitors
 */
export interface AstNode {
  alternate?: unknown
  argument?: unknown
  arguments?: unknown
  callee?: unknown
  computed?: unknown
  consequent?: unknown
  directive?: unknown
  elements?: unknown
  expression?: unknown
  id?: unknown
  init?: unknown
  key?: unknown
  left?: unknown
  loc?: AstLocation | null
  name?: unknown
  object?: unknown
  properties?: unknown
  property?: unknown
  quasi?: unknown
  quasis?: unknown
  range?: [number, number]
  right?: unknown
  tag?: unknown
  type: string
  value?: unknown
}

/**
 * Parser services used to combine Vue template and script visitors
 */
export interface ParserServices {
  defineTemplateBodyVisitor?: (
    templateVisitor: Record<string, (node: AstNode) => void>,
    scriptVisitor: Rule.RuleListener,
  ) => Rule.RuleListener
}

/**
 * Object side treated as class-bearing by legacy expression traversal
 */
export type ExpressionObjectMode = 'keys' | 'values'

/**
 * Check whether an unknown value is an AST node
 *
 * @param value Value to inspect
 * @returns Whether the value is an AST node
 */
export function isAstNode(value: unknown): value is AstNode {
  return isRecord(value) && isString(value['type'])
}

/**
 * Read a string from an unknown value
 *
 * @param value Value to inspect
 * @returns String value when present
 */
export function getString(value: unknown): string | undefined {
  return isString(value) ? value : undefined
}

/**
 * Read and narrow AST nodes from an unknown array value
 *
 * @param value Value to inspect
 * @returns Narrowed AST nodes
 */
export function getNodeArray(value: unknown): AstNode[] {
  return isArray(value) ? value.filter(item => isAstNode(item)) : []
}

/**
 * Get the static name represented by an AST property node
 *
 * @param node AST property node
 * @returns Static property name when available
 */
export function getPropertyName(node: AstNode): string | undefined {
  if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
    return getString(node.name)
  }

  if (node.type === 'Literal') {
    return getString(node.value)
  }

  return undefined
}

/**
 * Get the dotted static name represented by a callee node
 *
 * @param node AST callee node
 * @returns Dotted callee name when available
 */
export function getCalleeName(node: AstNode): string | undefined {
  if (node.type === 'Identifier') {
    return getString(node.name)
  }

  if (node.type !== 'MemberExpression' || !isAstNode(node.property)) {
    return undefined
  }

  const propertyName = getPropertyName(node.property)
  if (!propertyName) {
    return undefined
  }

  if (!isAstNode(node.object)) {
    return propertyName
  }

  const objectName = getCalleeName(node.object)
  return objectName ? `${objectName}.${propertyName}` : propertyName
}

/**
 * Get the static attribute name from a Vue template node
 *
 * @param node Vue attribute node
 * @returns Static attribute name when available
 */
export function getVueAttributeName(node: AstNode): string | undefined {
  if (!isAstNode(node.key)) {
    return undefined
  }

  if (node.directive === false && node.key.type === 'VIdentifier') {
    return getString(node.key.name)
  }

  if (
    node.directive === true &&
    node.key.type === 'VDirectiveKey' &&
    isAstNode(node.key.name) &&
    node.key.name.name === 'bind' &&
    isAstNode(node.key.argument)
  ) {
    return getString(node.key.argument.name)
  }

  return undefined
}
