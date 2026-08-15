import { isRecord } from '@ntnyq/utils'
import type { Rule } from 'eslint'

/**
 * UnoCSS settings shared with the official ESLint integration
 */
export interface UnoSettings {
  /**
   * Explicit UnoCSS configuration path
   */
  configPath?: string
}

/**
 * Read UnoCSS settings from the ESLint rule context
 *
 * @param context ESLint rule context
 * @returns UnoCSS settings when configured
 */
export function getSettings(
  context: Rule.RuleContext,
): UnoSettings | undefined {
  const { unocss } = context.settings
  return isRecord(unocss) ? (unocss as UnoSettings) : undefined
}
