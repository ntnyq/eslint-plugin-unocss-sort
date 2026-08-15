import { describe, expect, it } from 'vitest'
import {
  getCalleeName,
  getNodeArray,
  getPropertyName,
  getString,
  getVueAttributeName,
  isAstNode,
} from '../src/ast'
import type { AstNode } from '../src/ast'

describe('AST value guards', () => {
  it.each([
    { expected: true, value: { type: 'Identifier' } },
    { expected: false, value: { type: 1 } },
    { expected: false, value: null },
    { expected: false, value: 'Identifier' },
  ])('identifies AST nodes: $value', ({ expected, value }) => {
    expect(isAstNode(value)).toBe(expected)
  })

  it('narrows strings and node arrays', () => {
    const identifier = { type: 'Identifier' }

    expect(getString('value')).toBe('value')
    expect(getString(1)).toBeUndefined()
    expect(getNodeArray([identifier, null, { nope: true }])).toStrictEqual([
      identifier,
    ])
    expect(getNodeArray({ 0: identifier })).toStrictEqual([])
  })
})

describe('static AST names', () => {
  it.each<{
    expected: string | undefined
    node: AstNode
  }>([
    { expected: 'name', node: { name: 'name', type: 'Identifier' } },
    {
      expected: 'className',
      node: { name: 'className', type: 'JSXIdentifier' },
    },
    { expected: 'class', node: { type: 'Literal', value: 'class' } },
    { expected: undefined, node: { type: 'PrivateIdentifier' } },
    { expected: undefined, node: { type: 'Literal', value: 1 } },
  ])('gets a property name from $node.type', ({ expected, node }) => {
    expect(getPropertyName(node)).toBe(expected)
  })

  it('gets simple, nested, and computed callee names', () => {
    expect(getCalleeName({ name: 'clsx', type: 'Identifier' })).toBe('clsx')
    expect(
      getCalleeName({
        object: {
          object: { name: 'ui', type: 'Identifier' },
          property: { name: 'styles', type: 'Identifier' },
          type: 'MemberExpression',
        },
        property: { type: 'Literal', value: 'cx' },
        type: 'MemberExpression',
      }),
    ).toBe('ui.styles.cx')
  })

  it('rejects dynamic or malformed callee names', () => {
    expect(
      getCalleeName({
        object: { name: 'styles', type: 'Identifier' },
        type: 'MemberExpression',
      }),
    ).toBeUndefined()
    expect(
      getCalleeName({
        object: { name: 'styles', type: 'Identifier' },
        property: { name: 1, type: 'Identifier' },
        type: 'MemberExpression',
      }),
    ).toBeUndefined()
    expect(
      getCalleeName({
        property: { name: 'cx', type: 'Identifier' },
        type: 'MemberExpression',
      }),
    ).toBe('cx')
    expect(getCalleeName({ type: 'CallExpression' })).toBeUndefined()
  })
})

describe('Vue attribute names', () => {
  it('gets static and v-bind attribute names', () => {
    expect(
      getVueAttributeName({
        directive: false,
        key: { name: 'class', type: 'VIdentifier' },
        type: 'VAttribute',
      }),
    ).toBe('class')
    expect(
      getVueAttributeName({
        directive: true,
        key: {
          argument: { name: 'appear-active-class', type: 'VIdentifier' },
          name: { name: 'bind', type: 'VIdentifier' },
          type: 'VDirectiveKey',
        },
        type: 'VAttribute',
      }),
    ).toBe('appear-active-class')
  })

  it.each<AstNode>([
    { type: 'VAttribute' },
    {
      directive: true,
      key: { type: 'VDirectiveKey' },
      type: 'VAttribute',
    },
    {
      directive: true,
      key: {
        argument: { type: 'VExpressionContainer' },
        name: { name: 'bind', type: 'VIdentifier' },
        type: 'VDirectiveKey',
      },
      type: 'VAttribute',
    },
    {
      directive: true,
      key: {
        argument: { name: 'class', type: 'VIdentifier' },
        name: { name: 'on', type: 'VIdentifier' },
        type: 'VDirectiveKey',
      },
      type: 'VAttribute',
    },
  ])('ignores unsupported Vue attributes', node => {
    expect(getVueAttributeName(node)).toBeUndefined()
  })
})
