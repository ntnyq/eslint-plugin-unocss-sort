import { ESLint } from 'eslint'
import type { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import { plugin } from '../../src'

function lintWithOptions(options: unknown): Promise<ESLint.LintResult[]> {
  const eslint = new ESLint({
    overrideConfig: {
      plugins: { 'unocss-sort': plugin },
      rules: {
        'unocss-sort/order': ['error', options] as Linter.RuleEntry,
      },
    },
    overrideConfigFile: true,
  })

  return eslint.lintText("const clsRoot = 'flex p-2 text-white'", {
    filePath: 'schema.js',
  })
}

describe('order option schema', () => {
  it.each([
    { options: { unsupported: true }, reason: 'unknown top-level property' },
    { options: { type: 'random' }, reason: 'unknown sort type' },
    {
      options: { fallbackSort: { type: 'semantic' } },
      reason: 'unsupported fallback type',
    },
    {
      options: { groups: [{ group: 'spacing', unsupported: true }] },
      reason: 'unknown group override property',
    },
    {
      options: { variants: { placement: 'separate' } },
      reason: 'unknown variant placement',
    },
    {
      options: { variants: { unsupported: true } },
      reason: 'unknown variant property',
    },
    {
      options: {
        variants: { customGroups: [{ groupName: 'state' }] },
      },
      reason: 'incomplete custom variant group',
    },
    {
      options: { targets: [{ kind: 'attribute', name: { flags: 'i' } }] },
      reason: 'regex descriptor without a pattern',
    },
    {
      options: { targets: [{ kind: 'callee', name: '^cx$', path: '^cx$' }] },
      reason: 'unknown target property',
    },
  ])('rejects $reason', async ({ options }) => {
    await expect(lintWithOptions(options)).rejects.toThrow(/.+/u)
  })

  it('accepts a complete configuration using every option family', async () => {
    const [result] = await lintWithOptions({
      analysis: 'never',
      alphabet: 'zyx',
      customGroups: [
        {
          anyOf: [{ classNamePattern: '^brand-' }, { arbitrary: true }],
          fallbackSort: { order: 'desc', type: 'natural' },
          groupName: 'brand',
          order: 'asc',
          type: 'custom',
        },
      ],
      fallbackSort: { order: 'asc', type: 'code-point' },
      groups: [
        ['display', 'flex'],
        { group: ['spacing', 'sizing'], order: 'desc', type: 'natural' },
      ],
      ignoreCase: true,
      locales: ['en-US'],
      order: 'asc',
      partitionByNewLine: false,
      shortcuts: 'expanded',
      specialCharacters: 'remove',
      targets: [
        {
          kind: 'attribute',
          match: ['strings', { path: '^root$', type: 'object-values' }],
          name: { flags: 'i', pattern: '^ui-class$' },
        },
        { arguments: -1, kind: 'callee', name: '^cx$' },
        { kind: 'tag', name: '^tw$' },
        { kind: 'variable', name: '^styles$' },
      ],
      type: 'semantic',
      unknown: 'group',
      variants: {
        compoundOrder: 'inner-first',
        customGroups: [{ groupName: 'hocus', variantNamePattern: '^hocus$' }],
        groups: ['base', ['state', 'hocus']],
        placement: 'attached',
        responsiveOrder: 'natural',
      },
      whitespace: 'collapse',
    })

    expect(result?.fatalErrorCount).toBe(0)
  })
})
