import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { sortClassList } from '../../src'
import { analyzeUnoTokens } from '../../src/uno/analyze-uno-tokens'

const configPath = fileURLToPath(
  new URL('../fixtures/uno.config.ts', import.meta.url),
)

it('analyzes configured UnoCSS utilities and shortcuts', () => {
  const analysis = analyzeUnoTokens(
    ['flex', 'btn', 'tablet:flex', 'desktop:flex', 'not-a-utility'],
    import.meta.filename,
    configPath,
  )

  expect(analysis['flex']).toMatchObject({
    properties: ['display'],
    recognized: true,
    shortcut: false,
  })
  expect(analysis['btn']).toMatchObject({
    recognized: true,
    shortcut: true,
  })
  expect(sortClassList('desktop:flex tablet:flex', {}, analysis)).toBe(
    'tablet:flex desktop:flex',
  )
  expect(analysis['not-a-utility']).toStrictEqual({
    properties: [],
    recognized: false,
    shortcut: false,
  })
})
