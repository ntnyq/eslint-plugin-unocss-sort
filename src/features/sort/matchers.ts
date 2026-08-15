import { isString } from '@ntnyq/utils'
import type { RegexOption } from './types'

/**
 * Convert a regex option into a regular expression
 *
 * @param option Regular expression option
 * @param defaultFlags Flags used when the option does not provide them
 * @returns Constructed regular expression
 */
export function toRegExp(option: RegexOption, defaultFlags = ''): RegExp {
  if (isString(option)) {
    return new RegExp(option, defaultFlags)
  }

  return new RegExp(option.pattern, option.flags ?? defaultFlags)
}

/**
 * Check whether a value matches a regex option
 *
 * @param value Value to test
 * @param option Regular expression option
 * @returns Whether the value matches
 */
export function matchesRegexOption(
  value: string,
  option: RegexOption,
): boolean {
  const pattern = toRegExp(option)
  pattern.lastIndex = 0
  return pattern.test(value)
}
