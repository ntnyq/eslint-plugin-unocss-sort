import type { ESLint } from 'eslint'
import { meta } from './meta'
import { rules } from './rules'

/**
 * ESLint plugin entry containing package metadata and rule implementations
 */
export const plugin: ESLint.Plugin = {
  meta,
  rules,
}
