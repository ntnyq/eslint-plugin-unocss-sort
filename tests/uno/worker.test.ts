import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { sortClassList } from '../../src'
import { analyzeTokens } from '../../src/worker'

const configPath = fileURLToPath(
  new URL('../fixtures/worker/uno.config.ts', import.meta.url),
)
const sourceFilename = fileURLToPath(
  new URL('../fixtures/worker/source.ts', import.meta.url),
)
const minimalConfigPath = fileURLToPath(
  new URL('../fixtures/worker/minimal.config.ts', import.meta.url),
)
const invalidBreakpointConfigPath = fileURLToPath(
  new URL('../fixtures/worker/invalid-breakpoint.config.ts', import.meta.url),
)
const syntaxConfigPath = fileURLToPath(
  new URL('../fixtures/worker/syntax.config.ts', import.meta.url),
)

describe('UnoCSS analysis worker', () => {
  it('extracts properties, layers, rule metadata, shortcuts, and breakpoints', async () => {
    const result = await analyzeTokens(
      configPath,
      [
        'layer-low',
        'layer-high',
        'multi-prop',
        'btn',
        'missing',
        'hover:layer-low',
        'layer-low',
      ],
      sourceFilename,
    )

    expect(Object.keys(result).toSorted()).toStrictEqual([
      'btn',
      'hover:layer-low',
      'layer-high',
      'layer-low',
      'missing',
      'multi-prop',
    ])
    expect(result['layer-low']).toMatchObject({
      layer: 'reset',
      layerOrder: -10,
      metaSort: 7,
      officialOrder: expect.any(Number),
      properties: ['color'],
      recognized: true,
      shortcut: false,
    })
    const breakpoints = result['layer-low']?.breakpoints
    expect(breakpoints?.['phone']).toBe(0)
    expect(breakpoints?.['tablet']).toBeGreaterThan(breakpoints?.['phone'] ?? 0)
    expect(breakpoints?.['desktop']).toBeGreaterThan(
      breakpoints?.['tablet'] ?? 0,
    )
    expect(breakpoints?.['fluid']).toBeGreaterThan(
      breakpoints?.['desktop'] ?? 0,
    )
    expect(result['layer-high']).toMatchObject({
      layer: 'utilities',
      layerOrder: 20,
      metaSort: 3,
      properties: ['background-color'],
    })
    expect(result['multi-prop']?.properties.toSorted()).toStrictEqual([
      '--brand',
      'color',
    ])
    expect(result['btn']).toMatchObject({
      layer: 'components',
      layerOrder: 5,
      recognized: true,
      shortcut: true,
    })
    expect(result['btn']?.properties.toSorted()).toStrictEqual([
      'background-color',
      'color',
    ])
    expect(result['missing']).toStrictEqual({
      properties: [],
      recognized: false,
      separators: [':', '-'],
      shortcut: false,
    })
    expect(
      sortClassList(
        'layer-high missing btn layer-low hover:layer-low multi-prop',
        { type: 'uno' },
        result,
      ),
    ).toBe('missing btn layer-low layer-high multi-prop hover:layer-low')
  })

  it('discovers a configuration from physical and virtual filenames', async () => {
    const physical = await analyzeTokens(
      undefined,
      ['layer-low'],
      sourceFilename,
    )
    const virtual = await analyzeTokens(
      undefined,
      ['layer-high'],
      `${sourceFilename.replace(/\.ts$/u, '.vue')}/0.ts`,
    )

    expect(physical['layer-low']?.recognized).toBe(true)
    expect(virtual['layer-high']?.recognized).toBe(true)
  })

  it('reuses a cached generator for the same configuration', async () => {
    const first = await analyzeTokens(configPath, ['layer-low'], sourceFilename)
    const second = await analyzeTokens(
      configPath,
      ['layer-high'],
      sourceFilename,
    )

    expect(first['layer-low']?.layer).toBe('reset')
    expect(second['layer-high']?.layer).toBe('utilities')
  })

  it('reloads a cached generator after its configuration changes', async () => {
    const directory = await mkdtemp(
      join(tmpdir(), 'eslint-plugin-unocss-sort-worker-'),
    )
    const temporaryConfigPath = join(directory, 'uno.config.ts')
    const temporarySourcePath = join(directory, 'source.ts')

    try {
      await writeFile(
        temporaryConfigPath,
        "export default { rules: [['before', { color: 'red' }]] }\n",
      )
      const before = await analyzeTokens(
        temporaryConfigPath,
        ['before'],
        temporarySourcePath,
      )

      await writeFile(
        temporaryConfigPath,
        "export default { rules: [['changed', { display: 'block' }]] }\n",
      )
      const after = await analyzeTokens(
        temporaryConfigPath,
        ['changed', 'before'],
        temporarySourcePath,
      )

      expect(before['before']?.recognized).toBe(true)
      expect(after['changed']?.recognized).toBe(true)
      expect(after['before']?.recognized).toBe(false)
    } finally {
      await rm(directory, { recursive: true })
    }
  })

  it('handles configurations without breakpoint definitions', async () => {
    const result = await analyzeTokens(
      minimalConfigPath,
      ['custom'],
      sourceFilename,
    )

    expect(result['custom']?.breakpoints).toStrictEqual({})
  })

  it('places invalid non-string breakpoints after numeric breakpoints', async () => {
    const result = await analyzeTokens(
      invalidBreakpointConfigPath,
      ['custom'],
      sourceFilename,
    )

    expect(result['custom']?.breakpoints).toStrictEqual({
      invalid: 1,
      valid: 0,
    })
  })

  it('derives prefixed utilities and separators from the resolved config', async () => {
    const result = await analyzeTokens(
      syntaxConfigPath,
      [
        'uno-text-sm',
        'sm__(uno-p-2',
        'uno-flex)',
        "[&:nth-child(2)]__uno-content-['a:b']",
      ],
      sourceFilename,
    )

    expect(result['uno-text-sm']).toMatchObject({
      base: 'text-sm',
      prefix: 'uno-',
      separators: ['__'],
      variants: [],
    })
    expect(result['sm__uno-p-2']).toMatchObject({
      base: 'p-2',
      prefix: 'uno-',
      separators: ['__'],
      variants: ['sm'],
    })
    expect(result['sm__uno-flex']).toMatchObject({
      base: 'flex',
      prefix: 'uno-',
      separators: ['__'],
      variants: ['sm'],
    })
    expect(result["[&:nth-child(2)]__uno-content-['a:b']"]).toMatchObject({
      base: "content-['a:b']",
      prefix: 'uno-',
      separators: ['__'],
      variants: ['[&:nth-child(2)]'],
    })
  })

  it('sorts configured syntax without changing complex token contents', async () => {
    const input =
      "[&:nth-child(2)]__uno-content-['a:b'] uno-text-sm sm__(uno-p-2 uno-flex)"
    const result = await analyzeTokens(
      syntaxConfigPath,
      input.split(' '),
      sourceFilename,
    )

    expect(sortClassList(input, {}, result)).toBe(
      "uno-text-sm sm__(uno-flex uno-p-2) [&:nth-child(2)]__uno-content-['a:b']",
    )
  })

  it('rejects automatic analysis when no configuration can be found', async () => {
    await expect(
      analyzeTokens(
        undefined,
        ['flex'],
        '/tmp/eslint-plugin-unocss-sort-no-config/source.ts',
      ),
    ).rejects.toThrow('No UnoCSS config file was found')
  })
})
