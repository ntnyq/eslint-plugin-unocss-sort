import { describe, expect, it } from 'vitest'
import { sortClassList } from '../../src'
import type { OrderOptions, UtilityAnalysis } from '../../src'

const recognizedUtility = (
  overrides: Partial<UtilityAnalysis> = {},
): UtilityAnalysis => ({
  properties: ['padding'],
  recognized: true,
  shortcut: false,
  ...overrides,
})

describe.each<{
  expected: string
  input: string
  options: OrderOptions
}>([
  {
    expected: 'p-2 p-10',
    input: 'p-10 p-2',
    options: { type: 'natural' },
  },
  {
    expected: 'p-10 p-2',
    input: 'p-2 p-10',
    options: { type: 'alphabetical' },
  },
  {
    expected: 'p-10 p-2',
    input: 'p-2 p-10',
    options: { type: 'code-point' },
  },
  {
    expected: 'm-b m-a',
    input: 'm-a m-b',
    options: { alphabet: 'bma-', type: 'custom' },
  },
  {
    expected: 'flex p-2 p-1',
    input: 'p-2 flex p-1',
    options: {
      groups: ['display', 'spacing'],
      type: 'unsorted',
    },
  },
])('sort type: $options.type', ({ expected, input, options }) => {
  it(`sorts "${input}"`, () => {
    expect(sortClassList(input, options)).toBe(expected)
  })
})

describe('UnoCSS official sorting', () => {
  it('matches the official unknown, rule, variant, and tie ordering', () => {
    const analyses: Record<string, UtilityAnalysis> = {
      'custom-a': recognizedUtility({ officialOrder: 10 }),
      'custom-b': recognizedUtility({ officialOrder: 10 }),
      'custom-z': recognizedUtility({ officialOrder: 5 }),
      'hover:custom-a': recognizedUtility({ officialOrder: 100_010 }),
    }

    expect(
      sortClassList(
        'custom-b unknown-b hover:custom-a custom-z unknown-a custom-a',
        { type: 'uno' },
        analyses,
      ),
    ).toBe('unknown-b unknown-a custom-z custom-a custom-b hover:custom-a')
  })

  it('uses the official whitespace and variant-group normalization', () => {
    const analyses: Record<string, UtilityAnalysis> = {
      'hover:custom-a': recognizedUtility({ officialOrder: 100_010 }),
      'hover:custom-b': recognizedUtility({ officialOrder: 100_010 }),
    }

    expect(
      sortClassList(
        ' \nhover:(custom-b\tcustom-a) \n',
        { type: 'uno' },
        analyses,
      ),
    ).toBe(' hover:(custom-a custom-b) ')
  })
})

describe('UnoCSS metadata sorting', () => {
  it('sorts by layer, native rule order, and meta.sort in sequence', () => {
    const analyses: Record<string, UtilityAnalysis> = {
      'custom-a': recognizedUtility({
        layerOrder: 1,
        metaSort: 2,
        unoOrder: 10,
      }),
      'custom-b': recognizedUtility({
        layerOrder: 0,
        metaSort: 2,
        unoOrder: 20,
      }),
      'custom-c': recognizedUtility({
        layerOrder: 1,
        metaSort: 1,
        unoOrder: 10,
      }),
      'custom-d': recognizedUtility({
        layerOrder: 1,
        metaSort: 9,
        unoOrder: 5,
      }),
    }

    expect(
      sortClassList(
        'custom-a custom-b custom-c custom-d',
        { fallbackSort: { type: 'code-point' }, type: 'uno-metadata' },
        analyses,
      ),
    ).toBe('custom-b custom-d custom-c custom-a')
  })

  it('uses a configured fallback when UnoCSS metadata is equal', () => {
    const analyses: Record<string, UtilityAnalysis> = {
      'p-2': recognizedUtility({ unoOrder: 1 }),
      'p-10': recognizedUtility({ unoOrder: 1 }),
    }

    expect(
      sortClassList(
        'p-2 p-10',
        {
          fallbackSort: { order: 'desc', type: 'natural' },
          type: 'uno-metadata',
        },
        analyses,
      ),
    ).toBe('p-10 p-2')
  })
})

describe('comparison modifiers', () => {
  it('supports descending order', () => {
    expect(sortClassList('p-2 p-10', { order: 'desc' })).toBe('p-10 p-2')
  })

  it('orders custom-alphabet prefixes and identical values', () => {
    const options = { alphabet: 'ma-', type: 'custom' as const }

    expect(sortClassList('m-aa m-a', options)).toBe('m-a m-aa')
    expect(sortClassList('m-a m-aa', options)).toBe('m-a m-aa')
    expect(sortClassList('m-a m-a', options)).toBe('m-a m-a')
  })

  it('supports case-sensitive and case-insensitive comparisons', () => {
    expect(
      sortClassList('p-A p-a', {
        ignoreCase: false,
        type: 'alphabetical',
      }),
    ).toBe('p-a p-A')
    expect(
      sortClassList('p-A p-a', {
        ignoreCase: true,
        type: 'alphabetical',
      }),
    ).toBe('p-A p-a')
  })

  it('uses the configured locale or locales', () => {
    expect(
      sortClassList('p-ä p-z', {
        locales: ['sv-SE', 'en-US'],
        type: 'alphabetical',
      }),
    ).toBe('p-z p-ä')
  })

  it.each<{
    expected: string
    specialCharacters: NonNullable<OrderOptions['specialCharacters']>
  }>([
    { expected: '-m-2 m-1', specialCharacters: 'keep' },
    { expected: 'm-1 -m-2', specialCharacters: 'trim' },
    { expected: 'm-1 -m-2', specialCharacters: 'remove' },
  ])(
    'supports specialCharacters: $specialCharacters',
    ({ expected, specialCharacters }) => {
      expect(
        sortClassList('-m-2 m-1', {
          specialCharacters,
          type: 'code-point',
        }),
      ).toBe(expected)
    },
  )
})
