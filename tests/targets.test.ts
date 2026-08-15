import { describe, expect, it } from 'vitest'
import {
  matchesTargetName,
  matchesTargetValue,
  selectTargetArguments,
} from '../src/targets'
import type { CalleeTargetSelector, TargetSelector } from '../src/types'

const callArguments = [
  { type: 'Literal', value: 'first' },
  { type: 'Literal', value: 'last' },
]

function calleeTarget(
  argumentSelection: NonNullable<CalleeTargetSelector['arguments']>,
): CalleeTargetSelector {
  return { arguments: argumentSelection, kind: 'callee', name: '^cx$' }
}

describe('target names', () => {
  it('matches normalized attributes and full callee paths', () => {
    expect(
      matchesTargetName({ kind: 'attribute', name: '^ui-class$' }, 'uiClass'),
    ).toBe(true)
    expect(
      matchesTargetName({ kind: 'callee', name: '\\.cx$' }, 'styles.cx'),
    ).toBe(true)
    expect(matchesTargetName({ kind: 'tag', name: '^tw$' }, 'css')).toBe(false)
  })
})

describe('target matchers', () => {
  it('defaults to direct strings and supports positive object paths', () => {
    const target: TargetSelector = {
      kind: 'variable',
      match: ['strings', { path: '^variants\\.', type: 'object-values' }],
      name: '^styles$',
    }

    expect(matchesTargetValue(target, 'strings', '')).toBe(true)
    expect(
      matchesTargetValue(target, 'object-values', 'variants.size.sm'),
    ).toBe(true)
    expect(
      matchesTargetValue(target, 'object-values', 'defaultVariants.size'),
    ).toBe(false)
    expect(matchesTargetValue(target, 'object-keys', 'variants')).toBe(false)
  })

  it('uses strings as the default matcher', () => {
    const target: TargetSelector = { kind: 'tag', name: '^tw$' }

    expect(matchesTargetValue(target, 'strings', '')).toBe(true)
    expect(matchesTargetValue(target, 'object-values', 'root')).toBe(false)
  })
})

describe('callee argument selection', () => {
  it('supports named, positive, negative, and missing indexes', () => {
    expect(
      selectTargetArguments(calleeTarget('all'), callArguments),
    ).toStrictEqual(callArguments)
    expect(
      selectTargetArguments(calleeTarget('first'), callArguments),
    ).toStrictEqual([callArguments[0]])
    expect(
      selectTargetArguments(calleeTarget('last'), callArguments),
    ).toStrictEqual([callArguments[1]])
    expect(selectTargetArguments(calleeTarget(1), callArguments)).toStrictEqual(
      [callArguments[1]],
    )
    expect(
      selectTargetArguments(calleeTarget(-2), callArguments),
    ).toStrictEqual([callArguments[0]])
    expect(selectTargetArguments(calleeTarget(5), callArguments)).toStrictEqual(
      [],
    )
  })
})
