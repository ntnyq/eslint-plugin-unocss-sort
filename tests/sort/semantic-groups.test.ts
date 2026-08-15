import { describe, expect, it } from 'vitest'
import { sortClassList } from '../../src'

describe('built-in semantic groups', () => {
  it('classifies and orders every built-in semantic utility family', () => {
    const expected = [
      'overflow-hidden',
      'absolute',
      'flex',
      'flex-1',
      'grid-cols-2',
      'items-center',
      'p-2',
      'w-2',
      'text-sm',
      'bg-red',
      'border',
      'opacity-50',
      'blur',
      'rotate-1',
      'duration-200',
      'animate-spin',
      'cursor-pointer',
      'i-home',
      'fill-red',
      'sr-only',
      '[mask-type:luminance]',
      'component-button',
    ]

    expect(
      sortClassList(expected.toReversed().join(' '), { unknown: 'group' }),
    ).toBe(expected.join(' '))
  })

  it.each([
    ['layout', 'columns-2 object-cover overflow-hidden'],
    ['position', 'relative inset-2 z-10'],
    ['display', 'block inline-flex table-row'],
    ['flex', 'basis-2 grow-0 order-1'],
    ['grid', 'grid-cols-2 col-span-1 row-start-2'],
    ['alignment', 'justify-center items-start place-content-end'],
    ['spacing', '-m-2 px-4 space-x-2'],
    ['sizing', 'size-4 min-w-0 max-h-full'],
    ['typography', 'font-bold leading-4 tracking-wide'],
    ['background', 'bg-red from-blue to-green'],
    ['border', 'border rounded ring-2'],
    ['effects', 'shadow opacity-50 mix-blend-multiply'],
    ['filters', 'blur brightness-50 backdrop-blur'],
    ['transform', 'translate-x-2 rotate-2 scale-95'],
    ['transition', 'transition duration-200 ease-linear'],
    ['animation', 'animate-spin animate-pulse'],
    ['interactivity', 'cursor-pointer select-none touch-pan-x'],
    ['icons', 'i-carbon-add icon-home'],
    ['svg', 'fill-red stroke-2'],
    ['accessibility', 'sr-only not-sr-only'],
  ])(
    'keeps the %s family together ahead of unknown classes',
    (_, utilities) => {
      const input = `component-before ${utilities} component-after`
      const sorted = sortClassList(input, { unknown: 'group' }).split(' ')

      expect(sorted.slice(0, -2).toSorted()).toStrictEqual(
        utilities.split(' ').toSorted(),
      )
      expect(sorted.slice(-2)).toStrictEqual([
        'component-after',
        'component-before',
      ])
    },
  )

  it('classifies negative and important utilities by their base names', () => {
    const sorted = sortClassList('text-sm !p-2 flex -m-1 p-3!').split(' ')

    expect(sorted[0]).toBe('flex')
    expect(sorted.at(-1)).toBe('text-sm')
    expect(sorted.slice(1, -1).toSorted()).toStrictEqual(
      ['!p-2', '-m-1', 'p-3!'].toSorted(),
    )
  })
})
