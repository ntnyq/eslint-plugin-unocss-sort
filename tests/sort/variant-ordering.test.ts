import { describe, expect, it } from 'vitest'
import { sortClassList } from '../../src'
import type { UtilityAnalysis, VariantOptions } from '../../src'

const withBreakpoints = (
  breakpoints: Record<string, number>,
): UtilityAnalysis => ({
  breakpoints,
  properties: ['padding'],
  recognized: true,
  shortcut: false,
})

describe('variant ordering', () => {
  it('orders built-in variant groups', () => {
    expect(
      sortClassList('after:p-1 hover:p-1 md:p-1 dark:p-1 p-1 group-hover:p-1'),
    ).toBe('p-1 dark:p-1 md:p-1 group-hover:p-1 hover:p-1 after:p-1')
  })

  it('supports custom variant groups and equal-rank group arrays', () => {
    expect(
      sortClassList('motion-safe:p-1 focus:p-1 hocus:p-1 hover:p-1', {
        variants: {
          customGroups: [
            {
              groupName: 'motion',
              variantNamePattern: '^motion-',
            },
            {
              groupName: 'interaction',
              variantNamePattern: '^(?:hocus|focus|hover)$',
            },
          ],
          groups: [['interaction', 'state'], 'motion'],
        },
      }),
    ).toBe('focus:p-1 hocus:p-1 hover:p-1 motion-safe:p-1')
  })

  it('classifies every built-in variant family', () => {
    expect(
      sortClassList(
        'mystery:p-1 [&>*]:p-1 @[600px]:p-1 print:p-1 supports-grid:p-1 before:p-1 disabled:p-1 peer-hover:p-1 group-hover:p-1 @md:p-1 sm:p-1 light:p-1 dark:p-1 p-1',
      ),
    ).toBe(
      'p-1 dark:p-1 light:p-1 sm:p-1 @md:p-1 group-hover:p-1 peer-hover:p-1 disabled:p-1 before:p-1 print:p-1 supports-grid:p-1 @[600px]:p-1 [&>*]:p-1 mystery:p-1',
    )
  })

  it.each<{
    expected: string
    responsiveOrder: NonNullable<VariantOptions['responsiveOrder']>
  }>([
    {
      expected: 'tablet:p-1 desktop:p-1',
      responsiveOrder: 'theme',
    },
    {
      expected: 'desktop:p-1 tablet:p-1',
      responsiveOrder: 'source',
    },
    {
      expected: 'desktop:p-1 tablet:p-1',
      responsiveOrder: 'natural',
    },
  ])(
    'supports responsiveOrder: $responsiveOrder',
    ({ expected, responsiveOrder }) => {
      const utilityAnalysis = withBreakpoints({ desktop: 1, tablet: 0 })
      const analyses = {
        'desktop:p-1': utilityAnalysis,
        'tablet:p-1': utilityAnalysis,
      }

      expect(
        sortClassList(
          'desktop:p-1 tablet:p-1',
          { variants: { responsiveOrder } },
          analyses,
        ),
      ).toBe(expected)
    },
  )

  it('supports outer-first and inner-first compound variants', () => {
    const input = 'hover:sm:p-1 sm:hover:p-1'

    expect(
      sortClassList(input, {
        variants: { compoundOrder: 'outer-first' },
      }),
    ).toBe('sm:hover:p-1 hover:sm:p-1')
    expect(
      sortClassList(input, {
        variants: { compoundOrder: 'inner-first' },
      }),
    ).toBe('hover:sm:p-1 sm:hover:p-1')
  })

  it('orders a shorter matching variant chain before a longer chain', () => {
    expect(sortClassList('hover:focus:p-1 hover:p-1 p-1')).toBe(
      'p-1 hover:p-1 hover:focus:p-1',
    )
  })

  it('does not split colons inside arbitrary variants and properties', () => {
    expect(
      sortClassList(
        'hover:[&:nth-child(2)]:p-2 [mask-type:luminance] focus:p-2',
      ),
    ).toBe('[mask-type:luminance] focus:p-2 hover:[&:nth-child(2)]:p-2')
  })
})
