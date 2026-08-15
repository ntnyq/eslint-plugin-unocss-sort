import { describe, expect, it } from 'vitest'
import { getClassTokens, sortClassList } from '../../src'

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
        whitespace: 'collapse',
      }),
    ).toBe('flex p-2 text-white bg-red')
  })

  it('preserves or collapses whitespace independently of token order', () => {
    const input = 'text-white  flex\tp-2'

    expect(sortClassList(input)).toBe('flex  p-2\ttext-white')
    expect(sortClassList(input, { whitespace: 'collapse' })).toBe(
      'flex p-2 text-white',
    )
  })
})
