import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'
import vueParser from 'vue-eslint-parser'
import { DEFAULT_TARGETS, plugin } from '../src'

const fixtureDirectory = fileURLToPath(
  new URL('fixtures/integration', import.meta.url),
)
const fixtureFiles = ['component.js', 'component.jsx', 'component.vue']
const unoConfigPath = fileURLToPath(
  new URL('fixtures/uno.config.ts', import.meta.url),
)

function createESLint(fix: boolean): ESLint {
  return new ESLint({
    cwd: fixtureDirectory,
    fix,
    overrideConfig: [
      {
        files: ['**/*.js'],
        plugins: { 'unocss-sort': plugin },
        rules: { 'unocss-sort/order': 'error' },
      },
      {
        files: ['**/*.jsx'],
        languageOptions: {
          parserOptions: {
            ecmaFeatures: { jsx: true },
            ecmaVersion: 'latest',
            sourceType: 'module',
          },
        },
        plugins: { 'unocss-sort': plugin },
        rules: {
          'unocss-sort/order': [
            'error',
            {
              targets: [
                ...DEFAULT_TARGETS,
                { kind: 'attribute', name: '^data-ui$' },
              ],
            },
          ],
        },
      },
      {
        files: ['**/*.vue'],
        languageOptions: {
          parser: vueParser,
          parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
          },
        },
        plugins: { 'unocss-sort': plugin },
        rules: { 'unocss-sort/order': 'error' },
      },
    ],
    overrideConfigFile: true,
  })
}

describe('ESLint integration', () => {
  it('lints JavaScript and Vue fixture files through the public plugin', async () => {
    const results = await createESLint(false).lintFiles(fixtureFiles)

    expect(results).toHaveLength(3)
    expect(results.map(result => result.messages.length)).toStrictEqual([
      5, 3, 5,
    ])
    expect(
      results.flatMap(result =>
        result.messages.map(message => ({
          fixable: Boolean(message.fix),
          ruleId: message.ruleId,
          severity: message.severity,
        })),
      ),
    ).toStrictEqual(
      Array.from({ length: 13 }, () => ({
        fixable: true,
        ruleId: 'unocss-sort/order',
        severity: 2,
      })),
    )
  })

  it('produces fixed output without mutating fixture files', async () => {
    const sourcesBefore = await Promise.all(
      fixtureFiles.map(filename =>
        readFile(new URL(`fixtures/integration/${filename}`, import.meta.url), {
          encoding: 'utf8',
        }),
      ),
    )
    const results = await createESLint(true).lintFiles(fixtureFiles)
    const sourcesAfter = await Promise.all(
      fixtureFiles.map(filename =>
        readFile(new URL(`fixtures/integration/${filename}`, import.meta.url), {
          encoding: 'utf8',
        }),
      ),
    )

    expect(results.map(result => result.output)).toStrictEqual([
      `export const clsRoot = 'flex p-4 text-white'
export const view = clsx(
  'p-2 bg-red',
  { 'absolute opacity-0': hidden },
  ['grid text-sm', enabled && 'block m-2'],
)
`,
      `export const View = ({ active }) => (
  <div
    className="flex p-2 text-white"
    data-ui={active ? 'm-2 bg-red' : 'absolute opacity-0'}
  />
)
`,
      `<template>
  <Transition appear-active-class="flex text-white duration-200" />
  <div
    class="flex p-2 bg-red"
    :class="[
      'absolute opacity-0',
      active ? 'block m-2' : 'grid text-white',
    ]"
  />
</template>
`,
    ])
    expect(sourcesAfter).toStrictEqual(sourcesBefore)
  })

  it('loads UnoCSS settings while linting a configured file', async () => {
    const eslint = new ESLint({
      cwd: fixtureDirectory,
      fix: true,
      overrideConfig: {
        plugins: { 'unocss-sort': plugin },
        rules: {
          'unocss-sort/order': ['error', { shortcuts: 'group' }],
        },
        settings: {
          unocss: {
            configPath: unoConfigPath,
          },
        },
      },
      overrideConfigFile: true,
    })

    const [result] = await eslint.lintFiles(['configured.js'])

    expect(result?.messages).toStrictEqual([])
    expect(result?.output).toBe(
      "export const clsButton = 'flex text-white btn'\n",
    )
  })

  it('can disable analysis even when a config path is present', async () => {
    const eslint = new ESLint({
      fix: true,
      overrideConfig: {
        plugins: { 'unocss-sort': plugin },
        rules: {
          'unocss-sort/order': ['error', { analysis: 'never' }],
        },
        settings: {
          unocss: { configPath: '/missing/uno.config.ts' },
        },
      },
      overrideConfigFile: true,
    })

    const [result] = await eslint.lintText(
      "export const clsRoot = 'text-white flex'",
      { filePath: 'analysis-never.js' },
    )

    expect(result?.output).toBe("export const clsRoot = 'flex text-white'")
  })

  it('rejects analysis-dependent options when analysis is disabled', async () => {
    const eslint = new ESLint({
      overrideConfig: {
        plugins: { 'unocss-sort': plugin },
        rules: {
          'unocss-sort/order': ['error', { analysis: 'never', type: 'uno' }],
        },
      },
      overrideConfigFile: true,
    })

    await expect(
      eslint.lintText("export const clsRoot = 'p-2 flex'"),
    ).rejects.toThrow(
      'cannot be used with options that require UnoCSS metadata',
    )
  })

  it('requires a config when analysis is always enabled', async () => {
    const eslint = new ESLint({
      overrideConfig: {
        plugins: { 'unocss-sort': plugin },
        rules: {
          'unocss-sort/order': ['error', { analysis: 'always' }],
        },
        settings: {
          unocss: { configPath: '/missing/uno.config.ts' },
        },
      },
      overrideConfigFile: true,
    })

    await expect(
      eslint.lintText("export const clsRoot = 'p-2 flex'"),
    ).rejects.toThrow('Custom config file not found')
  })
})
