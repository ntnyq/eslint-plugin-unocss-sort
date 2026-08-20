import { rules as wind3Rules } from '@unocss/preset-wind3/rules'
import { describe, expect, it } from 'vitest'
import { sortClassList } from '../../src'
import { WIND3_V1_PROFILE } from '../../src/features/sort/profiles'

describe('built-in semantic groups', () => {
  it('classifies and orders every built-in semantic utility family', () => {
    const expected = [
      'overflow-hidden',
      'absolute',
      'flex',
      'table-row',
      'flex-1',
      'grid-cols-2',
      'items-center',
      'p-2',
      'w-2',
      'text-sm',
      'bg-red',
      'mask-cover',
      'border',
      'divide-solid',
      'opacity-50',
      'blur',
      'rotate-1',
      'duration-200',
      'animate-spin',
      'appearance-none',
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
      'backface-hidden break-before-page clear-both columns-2 contain-layout content-visibility-auto float-left object-cover overflow-hidden',
    ],
    ['position', 'relative inset-2 pos-fixed position-sticky z0 z-10'],
    ['display', 'block display-inherit inline-flex'],
    [
      'table',
      'border-collapse border-spacing-x-2 caption-top inline-table table-fixed table-row',
    ],
    ['flex', 'basis-2 grow-0 order-1'],
    ['grid', 'grid-cols-2 col-span-1 row-start-2'],
    [
      'alignment',
      'align-middle content-center items-start justify-center place-content-end vertical-top',
    ],
    ['spacing', '-m-2 m2 p2 px-4 space-x-2'],
    ['sizing', 'block-1 h20 inline-1 max-h-full min-w-0 size-4'],
    [
      'typography',
      'antialiased break-words c-red case-upper color-red content-empty diagonal-fractions font-bold fw-500 italic leading-4 lh-6 normal-nums placeholder-red tracking-wide write-vertical-right',
    ],
    ['background', 'bg-red from-blue to-green'],
    ['mask', 'mask-cover mask-no-repeat mask-radial-circle mask-type-alpha'],
    ['border', 'border ring-2 rounded'],
    ['divide', 'divide divide-block-4 divide-red divide-solid divide-x-2'],
    ['effects', 'image-render-pixel shadow opacity-50 mix-blend-multiply'],
    ['filters', 'blur brightness-50 backdrop-blur'],
    ['transform', 'perspect-100 rotate-2 scale-95 translate-x-2'],
    ['transition', 'duration-200 ease-linear transition view-transition-card'],
    ['animation', 'animate-spin animate-pulse'],
    [
      'ui-behavior',
      'accent-red appearance-none caret-red color-scheme-dark field-sizing-content scheme-light',
    ],
    ['interactivity', 'cursor-pointer select-none touch-pan-x'],
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

  it('keeps class-specific groups when CSS properties are broader', () => {
    const analyses = {
      'divide-solid': {
        properties: ['border-style'],
        recognized: true,
        shortcut: false,
      },
      'table-row': {
        properties: ['display'],
        recognized: true,
        shortcut: false,
      },
    }

    expect(
      sortClassList(
        'border table-row block divide-solid',
        {
          groups: ['table', 'display', 'divide', 'border'],
        },
        analyses,
      ),
    ).toBe('table-row block divide-solid border')
  })

  it('classifies new groups from generated CSS properties', () => {
    const analyses = {
      'generated-divide': {
        properties: ['--un-divide-x-reverse'],
        recognized: true,
        shortcut: false,
      },
      'generated-mask': {
        properties: ['mask-size'],
        recognized: true,
        shortcut: false,
      },
      'generated-table': {
        properties: ['table-layout'],
        recognized: true,
        shortcut: false,
      },
      'generated-ui': {
        properties: ['color-scheme'],
        recognized: true,
        shortcut: false,
      },
    }

    expect(
      sortClassList(
        'generated-ui generated-divide generated-table generated-mask',
        {
          groups: ['table', 'mask', 'divide', 'ui-behavior'],
        },
        analyses,
      ),
    ).toBe('generated-table generated-mask generated-divide generated-ui')
  })

  it('classifies remaining families from generated CSS properties', () => {
    const analyses = {
      'generated-antialiasing': {
        properties: ['-webkit-font-smoothing'],
        recognized: true,
        shortcut: false,
      },
      'generated-backface': {
        properties: ['backface-visibility'],
        recognized: true,
        shortcut: false,
      },
      'generated-image-rendering': {
        properties: ['image-rendering'],
        recognized: true,
        shortcut: false,
      },
      'generated-writing-mode': {
        properties: ['writing-mode'],
        recognized: true,
        shortcut: false,
      },
    }

    expect(
      sortClassList(
        'generated-writing-mode generated-image-rendering generated-backface generated-antialiasing',
        {
          groups: ['layout', 'typography', 'effects'],
        },
        analyses,
      ),
    ).toBe(
      'generated-backface generated-antialiasing generated-writing-mode generated-image-rendering',
    )
  })

  it('classifies every static Wind3 matcher', () => {
    const staticMatchers = wind3Rules
      .map(([matcher]) => matcher)
      .filter((matcher): matcher is string => typeof matcher === 'string')
    const unclassified = staticMatchers.filter(matcher => {
      const normalized = matcher.startsWith('-') ? matcher.slice(1) : matcher

      return !WIND3_V1_PROFILE.patterns.some(({ pattern }) =>
        pattern.test(normalized),
      )
    })

    expect(staticMatchers).toHaveLength(931)
    expect(unclassified).toStrictEqual([])
  })
})
