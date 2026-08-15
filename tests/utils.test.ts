import { describe, expect, it } from 'vitest'
import { DEFAULT_SORT_OPTIONS } from '../src'
import {
  compareCodePoints,
  matchesRegexOption,
  normalizeAttributeName,
  normalizeForComparison,
  resolveSortOptions,
  toRegExp,
} from '../src/utils'

describe('regular expression options', () => {
  it('supports strings, descriptors, default flags, and explicit flags', () => {
    expect(toRegExp('^class$', 'i').test('CLASS')).toBe(true)
    expect(toRegExp({ pattern: '^class$' }, 'i').test('CLASS')).toBe(true)
    expect(toRegExp({ flags: '', pattern: '^class$' }, 'i').test('CLASS')).toBe(
      false,
    )
  })

  it('resets stateful regular expressions between matches', () => {
    const option = { flags: 'g', pattern: 'brand' }

    expect(matchesRegexOption('brand-button', option)).toBe(true)
    expect(matchesRegexOption('brand-button', option)).toBe(true)
  })

  it('surfaces invalid regular expressions', () => {
    expect(() => toRegExp('[')).toThrow(SyntaxError)
  })
})

describe('attribute normalization', () => {
  it.each([
    ['appearActiveClass', 'appear-active-class'],
    ['CLASS_NAME', 'class-name'],
    ['leaveToClass', 'leave-to-class'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeAttributeName(input)).toBe(expected)
  })
})

describe('option resolution and comparison normalization', () => {
  it('resolves every default option', () => {
    expect(resolveSortOptions()).toStrictEqual(DEFAULT_SORT_OPTIONS)
  })

  it('replaces list options and deeply merges partial fallback and variants', () => {
    const resolved = resolveSortOptions({
      customGroups: [],
      fallbackSort: { order: 'desc', type: 'natural' },
      groups: ['known'],
      variants: {
        customGroups: [],
        groups: ['state'],
        placement: 'attached',
      },
    })

    expect(resolved).toMatchObject({
      customGroups: [],
      fallbackSort: { order: 'desc', type: 'natural' },
      groups: ['known'],
      variants: {
        compoundOrder: 'outer-first',
        customGroups: [],
        groups: ['state'],
        placement: 'attached',
        responsiveOrder: 'theme',
      },
      whitespace: 'preserve',
    })
  })

  it.each([
    { expected: '-Ab.c', mode: 'keep' as const },
    { expected: 'Ab.c', mode: 'trim' as const },
    { expected: 'Abc', mode: 'remove' as const },
  ])('normalizes special characters in $mode mode', ({ expected, mode }) => {
    expect(normalizeForComparison('-Ab.c', false, mode)).toBe(expected)
  })

  it('normalizes case and compares Unicode code points deterministically', () => {
    expect(normalizeForComparison('FOO', true, 'keep')).toBe('foo')
    expect(compareCodePoints('a', 'a')).toBe(0)
    expect(compareCodePoints('a', 'b')).toBe(-1)
    expect(compareCodePoints('b', 'a')).toBe(1)
  })
})
