import type { ESLint } from 'eslint'
import { meta } from './meta'
import { rules } from './rules'

export const plugin = {
  meta,
  rules,
} satisfies ESLint.Plugin
