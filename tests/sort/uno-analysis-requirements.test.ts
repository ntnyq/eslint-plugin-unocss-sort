import { describe, expect, it } from 'vitest'
import { requiresUnoAnalysis } from '../../src/features/sort/class-list'

describe('UnoCSS analysis requirements', () => {
  it('detects global, group-level, and custom-group UnoCSS sorting', () => {
    expect(requiresUnoAnalysis({ type: 'uno' })).toBe(true)
    expect(requiresUnoAnalysis({ type: 'uno-metadata' })).toBe(true)
    expect(
      requiresUnoAnalysis({
        groups: [{ group: 'spacing', type: 'uno-metadata' }],
      }),
    ).toBe(true)
    expect(
      requiresUnoAnalysis({
        customGroups: [
          {
            classNamePattern: '^x-',
            groupName: 'x',
            type: 'uno-metadata',
          },
        ],
      }),
    ).toBe(true)
  })

  it('requires analysis for metadata matchers and policies', () => {
    expect(
      requiresUnoAnalysis({
        customGroups: [{ cssPropertyPattern: '^color$', groupName: 'color' }],
        type: 'natural',
      }),
    ).toBe(true)
    expect(requiresUnoAnalysis({ shortcuts: 'group' })).toBe(true)
    expect(
      requiresUnoAnalysis({ variants: { responsiveOrder: 'theme' } }),
    ).toBe(true)
  })
})
