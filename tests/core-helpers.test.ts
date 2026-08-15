import { describe, expect, it } from 'vitest'
import { getClassTokens, sortClassList } from '../src'
import { requiresUnoAnalysis } from '../src/core'

describe('class-list parsing', () => {
  it('expands valid variant groups into analyzable tokens', () => {
    expect(getClassTokens('hover:(p-2 text-white) flex')).toStrictEqual([
      'hover:p-2',
      'hover:text-white',
      'flex',
    ])
  })

  it('keeps invalid variant-group syntax sortable without throwing', () => {
    expect(() => getClassTokens('hover:(p-2 text-white')).not.toThrow()
  })

  it('preserves CRLF partitions, indentation, and surrounding whitespace', () => {
    expect(sortClassList('  text-white p-2\r\n\tbg-red flex  ')).toBe(
      '  p-2 text-white\r\n\tflex bg-red  ',
    )
  })

  it('can sort across newlines as one partition', () => {
    expect(
      sortClassList('text-white p-2\n  bg-red flex', {
        partitionByNewLine: false,
      }),
    ).toBe('flex p-2 text-white bg-red')
  })
})

describe('UnoCSS analysis requirements', () => {
  it('detects global, group-level, and custom-group UnoCSS sorting', () => {
    expect(requiresUnoAnalysis({ type: 'uno' })).toBe(true)
    expect(
      requiresUnoAnalysis({ groups: [{ group: 'spacing', type: 'uno' }] }),
    ).toBe(true)
    expect(
      requiresUnoAnalysis({
        customGroups: [
          { classNamePattern: '^x-', groupName: 'x', type: 'uno' },
        ],
      }),
    ).toBe(true)
  })

  it('does not require analysis for metadata matchers alone', () => {
    expect(
      requiresUnoAnalysis({
        customGroups: [{ cssPropertyPattern: '^color$', groupName: 'color' }],
        type: 'natural',
      }),
    ).toBe(false)
  })
})
