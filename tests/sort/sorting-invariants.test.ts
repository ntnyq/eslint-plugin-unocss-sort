import { describe, expect, it } from 'vitest'
import { sortClassList } from '../../src'
import type { OrderOptions } from '../../src'

const input =
  'hover:bg-red component-button p-10 flex p-2 text-white sm:grid opacity-50'

describe('sorting invariants', () => {
  it.each<{
    name: string
    options: OrderOptions
  }>([
    { name: 'defaults', options: {} },
    { name: 'descending natural', options: { order: 'desc', type: 'natural' } },
    {
      name: 'grouped unknown utilities',
      options: { type: 'alphabetical', unknown: 'group' },
    },
    {
      name: 'attached variants',
      options: { variants: { placement: 'attached' } },
    },
    {
      name: 'custom groups',
      options: {
        customGroups: [
          { classNamePattern: '^component-', groupName: 'components' },
        ],
        groups: ['components', 'display', 'spacing', 'unknown'],
        unknown: 'group',
      },
    },
  ])('is idempotent with $name', ({ options }) => {
    const sorted = sortClassList(input, options)

    expect(sortClassList(sorted, options)).toBe(sorted)
  })

  it.each<{
    name: string
    options: OrderOptions
  }>([
    { name: 'semantic', options: { unknown: 'group' } },
    { name: 'natural', options: { type: 'natural', unknown: 'group' } },
    { name: 'code point', options: { type: 'code-point', unknown: 'group' } },
    {
      name: 'custom alphabet',
      options: { alphabet: 'zyxwvutsrqponmlkjihgfedcba', type: 'custom' },
    },
  ])('preserves the token multiset with $name sorting', ({ options }) => {
    const sourceTokens = input.split(' ').toSorted()
    const sortedTokens = sortClassList(input, options).split(' ').toSorted()

    expect(sortedTokens).toStrictEqual(sourceTokens)
  })

  it('preserves duplicates exactly', () => {
    const sorted = sortClassList('p-2 flex p-2 flex p-10')

    expect(sorted).toBe('flex flex p-2 p-2 p-10')
  })

  it('never moves pinned unknown utilities across partitions', () => {
    expect(
      sortClassList(
        'text-white component-a p-2 flex component-b bg-red border',
      ),
    ).toBe('text-white component-a flex p-2 component-b bg-red border')
  })

  it('keeps whitespace-only and empty inputs unchanged', () => {
    expect(sortClassList('')).toBe('')
    expect(sortClassList(' \t  ')).toBe(' \t  ')
    expect(sortClassList('\n\n')).toBe('\n\n')
  })
})
