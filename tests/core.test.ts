import { describe, expect, it } from 'vitest'
import { sortClassList } from '../src'

describe('semantic class-list ordering', () => {
  it('sorts utilities by stable semantic groups and natural values', () => {
    expect(sortClassList('text-white flex p-10 p-2 bg-red absolute')).toBe(
      'absolute flex p-2 p-10 text-white bg-red',
    )
  })

  it('keeps unknown utilities pinned by default', () => {
    expect(sortClassList('p-4 component-button flex items-center')).toBe(
      'p-4 component-button flex items-center',
    )
  })

  it('supports Perfectionist-style groups and customGroups', () => {
    expect(
      sortClassList('p-2 brand-z flex brand-a', {
        customGroups: [
          {
            classNamePattern: '^brand-',
            groupName: 'brand',
            type: 'natural',
          },
        ],
        groups: ['display', 'brand', 'spacing', 'unknown'],
        unknown: 'group',
      }),
    ).toBe('flex brand-a brand-z p-2')
  })

  it('supports grouped and attached variant placement', () => {
    const input = 'hover:bg-red bg-blue focus:text-white text-black'

    expect(sortClassList(input)).toBe(
      'text-black bg-blue focus:text-white hover:bg-red',
    )
    expect(
      sortClassList(input, {
        variants: { placement: 'attached' },
      }),
    ).toBe('text-black focus:text-white bg-blue hover:bg-red')
  })

  it('uses breakpoint order and preserves variant groups', () => {
    expect(sortClassList('lg:grid sm:grid block')).toBe('block sm:grid lg:grid')
    expect(sortClassList('hover:(text-white bg-red) flex')).toBe(
      'flex hover:(text-white bg-red)',
    )
  })

  it('partitions multiline class lists and is idempotent', () => {
    const input = 'text-white p-2\n  bg-red flex'
    const sorted = 'p-2 text-white\n  flex bg-red'

    expect(sortClassList(input)).toBe(sorted)
    expect(sortClassList(sorted)).toBe(sorted)
  })
})
