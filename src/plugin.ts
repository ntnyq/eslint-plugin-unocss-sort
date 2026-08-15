import type { ESLint } from 'eslint'
import { meta } from './meta'
import { rules } from './rules'

export const plugin: ESLint.Plugin = {
  meta,
  rules,
}
