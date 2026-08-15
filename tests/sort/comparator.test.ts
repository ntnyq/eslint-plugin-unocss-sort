import { describe, expect, it } from 'vitest'
import {
  compareCodePoints,
  normalizeForComparison,
} from '../../src/features/sort/comparator'

describe('comparison normalization', () => {
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
