import { describe, expect, it } from 'vitest'
import { matchesRegexOption, toRegExp } from '../../src/features/sort/matchers'

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
