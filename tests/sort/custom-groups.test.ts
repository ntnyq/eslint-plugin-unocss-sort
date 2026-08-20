import { describe, expect, it } from 'vitest'
import { sortClassList } from '../../src'
import type { UtilityAnalysis } from '../../src'

const analysis = (
  overrides: Partial<UtilityAnalysis> = {},
): UtilityAnalysis => ({
  properties: [],
  recognized: true,
  shortcut: false,
  ...overrides,
})

describe('utility groups', () => {
  it('supports strings, equal-rank arrays, and group-level overrides', () => {
    expect(
      sortClassList('p-2 grid-cols-2 flex-1 p-10', {
        groups: [
          ['flex', 'grid'],
          { group: 'spacing', order: 'desc', type: 'natural' },
        ],
      }),
    ).toBe('flex-1 grid-cols-2 p-10 p-2')
  })

  it('applies one override to multiple named groups', () => {
    expect(
      sortClassList('text-a p-2 text-b p-10', {
        groups: [
          {
            group: ['spacing', 'typography'],
            order: 'desc',
            type: 'natural',
          },
        ],
      }),
    ).toBe('p-10 p-2 text-b text-a')
  })

  it('uses a group-level fallback before the global fallback', () => {
    const analyses = {
      'p-2': analysis({ properties: ['padding'], unoOrder: 1 }),
      'p-10': analysis({ properties: ['padding'], unoOrder: 1 }),
    }

    expect(
      sortClassList(
        'p-2 p-10',
        {
          fallbackSort: { type: 'code-point' },
          groups: [
            {
              fallbackSort: { order: 'desc', type: 'natural' },
              group: 'spacing',
              type: 'uno-metadata',
            },
          ],
        },
        analyses,
      ),
    ).toBe('p-10 p-2')
  })

  it('selects the generated property group with the highest configured priority', () => {
    const analyses = {
      multi: analysis({ properties: ['display', 'color'] }),
    }

    expect(
      sortClassList(
        'flex multi text-sm',
        { groups: ['typography', 'display', 'known'] },
        analyses,
      ),
    ).toBe('text-sm multi flex')
    expect(
      sortClassList(
        'text-sm multi flex',
        { groups: ['display', 'typography', 'known'] },
        analyses,
      ),
    ).toBe('flex multi text-sm')
  })

  it('can group unknown utilities instead of pinning them', () => {
    const input = 'p-4 component-button flex items-center'

    expect(sortClassList(input)).toBe(input)
    expect(sortClassList(input, { unknown: 'group' })).toBe(
      'flex items-center p-4 component-button',
    )
  })

  it('supports all shortcut placement modes', () => {
    const analyses = {
      btn: analysis({ properties: ['padding'], shortcut: true }),
    }
    const input = 'text-white btn flex'

    expect(sortClassList(input, { shortcuts: 'expanded' }, analyses)).toBe(
      'flex btn text-white',
    )
    expect(
      sortClassList(input, { shortcuts: 'preserve-position' }, analyses),
    ).toBe(input)
    expect(sortClassList(input, { shortcuts: 'group' }, analyses)).toBe(
      'flex text-white btn',
    )
  })
})

describe('custom utility group matchers', () => {
  it('matches class names using regex descriptors', () => {
    expect(
      sortClassList('p-2 BRAND-z flex brand-a', {
        customGroups: [
          {
            classNamePattern: { flags: 'i', pattern: '^brand-' },
            groupName: 'brand',
            type: 'natural',
          },
        ],
        groups: ['brand', 'display', 'spacing'],
      }),
    ).toBe('brand-a BRAND-z flex p-2')
  })

  it('matches generated CSS properties and layers', () => {
    const analyses = {
      base: analysis({ layer: 'base', properties: ['color'] }),
      component: analysis({ layer: 'components', properties: ['color'] }),
      spacing: analysis({ layer: 'components', properties: ['padding'] }),
    }

    expect(
      sortClassList(
        'base spacing component',
        {
          customGroups: [
            {
              cssPropertyPattern: '^color$',
              groupName: 'component-color',
              layer: ['components', 'utilities'],
            },
          ],
          groups: ['component-color', 'known'],
          type: 'natural',
        },
        analyses,
      ),
    ).toBe('component base spacing')
  })

  it('matches recognized, shortcut, and arbitrary utilities', () => {
    const analyses = {
      btn: analysis({ shortcut: true }),
      generated: analysis(),
      unknown: analysis({ recognized: false }),
    }

    expect(
      sortClassList(
        'unknown generated [mask-type:luminance] btn',
        {
          customGroups: [
            { groupName: 'shortcuts', shortcut: true },
            { arbitrary: true, groupName: 'arbitrary' },
            { groupName: 'generated', recognized: true },
          ],
          groups: ['shortcuts', 'arbitrary', 'generated', 'unknown'],
          shortcuts: 'expanded',
          type: 'natural',
          unknown: 'group',
        },
        analyses,
      ),
    ).toBe('btn [mask-type:luminance] generated unknown')
  })

  it('matches variant names and supports anyOf alternatives', () => {
    expect(
      sortClassList('focus:p-2 i-home hover:p-2 flex', {
        customGroups: [
          {
            groupName: 'interactive',
            variantNamePattern: '^(?:hover|focus)$',
          },
          {
            anyOf: [
              { classNamePattern: '^i-' },
              { cssPropertyPattern: '^(?:fill|stroke)$' },
            ],
            groupName: 'icons',
          },
        ],
        groups: ['interactive', 'icons', 'display', 'spacing'],
        type: 'natural',
      }),
    ).toBe('i-home flex focus:p-2 hover:p-2')
  })

  it('uses the first matching custom group', () => {
    expect(
      sortClassList('brand-b brand-a flex', {
        customGroups: [
          {
            classNamePattern: '^brand-',
            groupName: 'first',
            order: 'desc',
            type: 'natural',
          },
          {
            classNamePattern: '^brand-',
            groupName: 'second',
          },
        ],
        groups: ['first', 'second', 'display'],
      }),
    ).toBe('brand-b brand-a flex')
  })

  it('does not match a custom group without conditions', () => {
    expect(
      sortClassList('component flex', {
        customGroups: [{ groupName: 'empty' }],
        groups: ['empty', 'display', 'unknown'],
        unknown: 'group',
      }),
    ).toBe('flex component')
  })

  it('supports false boolean matcher conditions', () => {
    const analyses = {
      generated: analysis(),
      shortcut: analysis({ shortcut: true }),
    }

    expect(
      sortClassList(
        'shortcut [color:red] generated',
        {
          customGroups: [
            {
              arbitrary: false,
              groupName: 'regular-generated',
              recognized: true,
              shortcut: false,
            },
          ],
          groups: ['regular-generated', 'arbitrary-property', 'known'],
          shortcuts: 'expanded',
        },
        analyses,
      ),
    ).toBe('generated [color:red] shortcut')
  })

  it('applies custom-group sort and fallback overrides', () => {
    const analyses = {
      'brand-2': analysis({ unoOrder: 1 }),
      'brand-10': analysis({ unoOrder: 1 }),
    }

    expect(
      sortClassList(
        'brand-2 brand-10 flex',
        {
          customGroups: [
            {
              classNamePattern: '^brand-',
              fallbackSort: { order: 'desc', type: 'natural' },
              groupName: 'brand',
              type: 'uno-metadata',
            },
          ],
          groups: ['display', 'brand'],
        },
        analyses,
      ),
    ).toBe('flex brand-10 brand-2')
  })
})
