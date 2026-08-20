import { describe, expect, expectTypeOf, it } from 'vitest'
import { DEFAULT_SORT_OPTIONS, sortClassList } from '../../src'
import type {
  SemanticOrderVersion,
  SemanticProfile,
  SortOptions,
} from '../../src'
import { WIND3_V1_PROFILE } from '../../src/features/sort/profiles'
import { WIND3_V1_COMPATIBILITY_FIXTURES } from '../fixtures/semantic/wind3-v1'

describe('semantic profiles', () => {
  it('exposes the supported profile and order version types', () => {
    expectTypeOf<SemanticProfile>().toEqualTypeOf<'wind3'>()
    expectTypeOf<SemanticOrderVersion>().toEqualTypeOf<1>()
  })

  it('defaults to the versioned Wind3 profile', () => {
    expect(DEFAULT_SORT_OPTIONS).toMatchObject({
      orderVersion: 1,
      profile: 'wind3',
    })
  })

  it('does not expose mutable profile collections through defaults', () => {
    expect(DEFAULT_SORT_OPTIONS.groups).not.toBe(WIND3_V1_PROFILE.groups)
    expect(DEFAULT_SORT_OPTIONS.customGroups).not.toBe(
      WIND3_V1_PROFILE.customGroups,
    )
    expect(DEFAULT_SORT_OPTIONS.variants.groups).not.toBe(
      WIND3_V1_PROFILE.variantGroups,
    )
    expect(DEFAULT_SORT_OPTIONS.variants.customGroups).not.toBe(
      WIND3_V1_PROFILE.variantCustomGroups,
    )
  })

  it.each(WIND3_V1_COMPATIBILITY_FIXTURES)(
    'preserves the v0.1.0 output for $name',
    ({ expected, input }) => {
      expect(sortClassList(input)).toBe(expected)
      expect(
        sortClassList(input, {
          orderVersion: 1,
          profile: 'wind3',
        }),
      ).toBe(expected)
    },
  )

  it.each([
    { orderVersion: 1, profile: 'wind4' },
    { orderVersion: 2, profile: 'wind3' },
  ])(
    'rejects unsupported profile coordinates: $profile@$orderVersion',
    options => {
      expect(() =>
        sortClassList('text-white flex', options as unknown as SortOptions),
      ).toThrow('Unsupported semantic profile')
    },
  )
})
