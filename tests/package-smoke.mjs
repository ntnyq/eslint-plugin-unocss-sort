/* oxlint-disable node/no-top-level-await -- The package only supports modern Node.js. */
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { ESLint as ESLint10 } from 'eslint'
import { ESLint as ESLint9 } from 'eslint9'
import unocssSort, {
  defaultOrderOptions,
  plugin,
  sortClassList,
} from '../dist/index.mjs'

assert.equal(unocssSort, plugin)
assert.equal(typeof plugin.rules?.['order']?.create, 'function')
assert.equal(defaultOrderOptions.type, 'semantic')
assert.equal(sortClassList('text-white flex p-2'), 'flex p-2 text-white')

const configPath = fileURLToPath(
  new URL('fixtures/uno.config.ts', import.meta.url),
)
async function lintWith(ESLint) {
  const eslint = new ESLint({
    fix: true,
    overrideConfig: {
      plugins: { 'unocss-sort': plugin },
      rules: {
        'unocss-sort/order': ['error', { shortcuts: 'group' }],
      },
      settings: {
        unocss: { configPath },
      },
    },
    overrideConfigFile: true,
  })
  const [result] = await eslint.lintText(
    "export const clsButton = 'text-white btn flex'",
    {
      filePath: fileURLToPath(new URL('fixtures/package.js', import.meta.url)),
    },
  )

  return result
}

for (const result of await Promise.all([
  lintWith(ESLint9),
  lintWith(ESLint10),
])) {
  assert.deepEqual(result?.messages, [])
  assert.equal(result?.output, "export const clsButton = 'flex text-white btn'")
}
