import { describe, expect, it } from 'vitest'
import { DEFAULT_SORT_OPTIONS } from '../../src'
import { resolveSortOptions } from '../../src/features/sort/options'

describe('sort option resolution', () => {
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
})
