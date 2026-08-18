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
    [
      'layout',
      'break-before-page clear-both columns-2 contain-layout content-visibility-auto float-left object-cover overflow-hidden',
    ],
    ['position', 'relative inset-2 pos-fixed position-sticky z0 z-10'],
    ['display', 'block display-inherit inline-flex table-row'],
    ['flex', 'basis-2 grow-0 order-1'],
    ['grid', 'grid-cols-2 col-span-1 row-start-2'],
    [
      'alignment',
      'align-middle content-center items-start justify-center place-content-end vertical-top',
    ],
    ['spacing', '-m-2 divide divide-block-4 divide-x-2 m2 p2 px-4 space-x-2'],
    ['sizing', 'block-1 h20 inline-1 max-h-full min-w-0 size-4'],
    [
      'typography',
      'break-words c-red color-red content-empty font-bold fw-500 leading-4 lh-6 placeholder-red tracking-wide',
    ],
    ['background', 'bg-red from-blue to-green'],
    ['border', 'border divide-red divide-solid ring-2 rounded'],
    ['effects', 'shadow opacity-50 mix-blend-multiply'],
    ['filters', 'blur brightness-50 backdrop-blur'],
    ['transform', 'perspect-100 rotate-2 scale-95 translate-x-2'],
    ['transition', 'duration-200 ease-linear transition view-transition-card'],
    ['animation', 'animate-spin animate-pulse'],
    [
      'interactivity',
      'cursor-pointer field-sizing-content select-none touch-pan-x',
    ],
    ['icons', 'i-carbon-add icon-home'],
    ['svg', 'fill-red stroke-2'],
    ['accessibility', 'sr-only not-sr-only'],
  ])('classifies the %s family into its built-in group', (group, utilities) => {
    const input = `component-before ${utilities} component-after`
    const sorted = sortClassList(input, {
      groups: [group, 'unknown'],
      unknown: 'group',
    }).split(' ')

    expect(sorted.slice(0, -2).toSorted()).toStrictEqual(
      utilities.split(' ').toSorted(),
    )
    expect(sorted.slice(-2)).toStrictEqual([
      'component-after',
      'component-before',
    ])
  })

  it('classifies negative and important utilities by their base names', () => {
    const sorted = sortClassList('text-sm !p-2 flex -m-1 p-3!').split(' ')

    expect(sorted[0]).toBe('flex')
    expect(sorted.at(-1)).toBe('text-sm')
    expect(sorted.slice(1, -1).toSorted()).toStrictEqual(
      ['!p-2', '-m-1', 'p-3!'].toSorted(),
    )
  })

  it('disambiguates overlapping UnoCSS properties', () => {
    const analyses = {
      'break-before-page': {
        properties: ['break-before'],
        recognized: true,
        shortcut: false,
      },
      'break-words': {
        properties: ['overflow-wrap'],
        recognized: true,
        shortcut: false,
      },
      'content-empty': {
        properties: ['content'],
        recognized: true,
        shortcut: false,
      },
      'content-visibility-auto': {
        properties: ['content-visibility'],
        recognized: true,
        shortcut: false,
      },
    }

    expect(
      sortClassList(
        'break-before-page content-empty component content-visibility-auto break-words',
        {
          groups: ['typography', 'unknown', 'layout'],
          unknown: 'group',
        },
        analyses,
      ),
    ).toBe(
      'break-words content-empty component break-before-page content-visibility-auto',
    )
  })
})
