/* oxlint-disable node/no-top-level-await -- The package only supports modern Node.js. */
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { ESLint as ESLint10 } from 'eslint'
import { ESLint as ESLint9 } from 'eslint9'
import unocssSort, {
  DEFAULT_SORT_OPTIONS,
  plugin,
  sortClassList,
} from '../dist/index.mjs'

assert.equal(unocssSort, plugin)
assert.equal(typeof plugin.rules?.['order']?.create, 'function')
assert.equal(typeof plugin.rules?.['no-duplicate-classes']?.create, 'function')
assert.equal(DEFAULT_SORT_OPTIONS.type, 'semantic')
assert.equal(DEFAULT_SORT_OPTIONS.profile, 'wind3')
assert.equal(DEFAULT_SORT_OPTIONS.orderVersion, 1)
assert.equal(sortClassList('text-white flex p-2'), 'flex p-2 text-white')
assert.equal(
  sortClassList('text-white flex p-2', {
    orderVersion: 1,
    profile: 'wind3',
  }),
  'flex p-2 text-white',
)

const configPath = fileURLToPath(
  new URL('fixtures/uno.config.ts', import.meta.url),
)
async function lintWith(ESLint, rule, input) {
  const eslint = new ESLint({
    fix: true,
    overrideConfig: {
      plugins: { 'unocss-sort': plugin },
      rules: {
        [`unocss-sort/${rule.name}`]: ['error', ...(rule.options ?? [])],
      },
      settings: {
        unocss: { configPath },
      },
    },
    overrideConfigFile: true,
  })
  const [result] = await eslint.lintText(input, {
    filePath: fileURLToPath(new URL('fixtures/package.js', import.meta.url)),
  })

  return result
}

const results = await Promise.all(
  [ESLint9, ESLint10].map(async ESLint => {
    const [metadataResult, officialResult, duplicateResult] = await Promise.all(
      [
        lintWith(
          ESLint,
          { name: 'order', options: [{ shortcuts: 'group' }] },
          "export const clsButton = 'text-white btn flex'",
        ),
        lintWith(
          ESLint,
          { name: 'order', options: [{ type: 'uno' }] },
          "export const clsButton = 'text-white unknown flex p-2 hover:flex'",
        ),
        lintWith(
          ESLint,
          { name: 'no-duplicate-classes' },
          "export const clsButton = 'flex p-2 flex'",
        ),
      ],
    )

    return { duplicateResult, metadataResult, officialResult }
  }),
)

for (const { duplicateResult, metadataResult, officialResult } of results) {
  assert.deepEqual(metadataResult?.messages, [])
  assert.equal(
    metadataResult?.output,
    "export const clsButton = 'flex text-white btn'",
  )

  assert.deepEqual(officialResult?.messages, [])
  assert.equal(
    officialResult?.output,
    "export const clsButton = 'unknown flex p-2 text-white hover:flex'",
  )

  assert.deepEqual(duplicateResult?.messages, [])
  assert.equal(duplicateResult?.output, "export const clsButton = 'flex p-2'")
}
