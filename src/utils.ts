import { isString } from '@ntnyq/utils'
import { DEFAULT_SORT_OPTIONS, DEFAULT_VARIANT_GROUPS } from './constants'
import type {
  RegexOption,
  ResolvedSortOptions,
  SortOptions,
  SpecialCharacters,
} from './types'

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

/**
 * Normalize an attribute name to lowercase kebab case
 *
 * @param name Attribute name
 * @returns Normalized attribute name
 */
export function normalizeAttributeName(name: string): string {
  return name
    .replaceAll(
      /(?<lowercase>[a-z\d])(?<uppercase>[A-Z])/gu,
      '$<lowercase>-$<uppercase>',
    )
    .replaceAll('_', '-')
    .toLowerCase()
}

/**
 * Merge user options with the built-in ordering defaults
 *
 * @param options User-facing ordering options
 * @returns Fully resolved ordering options
 */
export function resolveSortOptions(
  options: SortOptions = {},
): ResolvedSortOptions {
  return {
    alphabet: options.alphabet ?? DEFAULT_SORT_OPTIONS.alphabet,
    customGroups: options.customGroups ?? [
      ...DEFAULT_SORT_OPTIONS.customGroups,
    ],
    fallbackSort: {
      ...DEFAULT_SORT_OPTIONS.fallbackSort,
      ...options.fallbackSort,
    },
    groups: options.groups ?? [...DEFAULT_SORT_OPTIONS.groups],
    ignoreCase: options.ignoreCase ?? DEFAULT_SORT_OPTIONS.ignoreCase,
    locales: options.locales ?? DEFAULT_SORT_OPTIONS.locales,
    order: options.order ?? DEFAULT_SORT_OPTIONS.order,
    partitionByNewLine:
      options.partitionByNewLine ?? DEFAULT_SORT_OPTIONS.partitionByNewLine,
    shortcuts: options.shortcuts ?? DEFAULT_SORT_OPTIONS.shortcuts,
    specialCharacters:
      options.specialCharacters ?? DEFAULT_SORT_OPTIONS.specialCharacters,
    type: options.type ?? DEFAULT_SORT_OPTIONS.type,
    unknown: options.unknown ?? DEFAULT_SORT_OPTIONS.unknown,
    variants: {
      compoundOrder:
        options.variants?.compoundOrder ??
        DEFAULT_SORT_OPTIONS.variants.compoundOrder,
      customGroups: options.variants?.customGroups ?? [
        ...DEFAULT_SORT_OPTIONS.variants.customGroups,
      ],
      groups: options.variants?.groups ?? [...DEFAULT_VARIANT_GROUPS],
      placement:
        options.variants?.placement ?? DEFAULT_SORT_OPTIONS.variants.placement,
      responsiveOrder:
        options.variants?.responsiveOrder ??
        DEFAULT_SORT_OPTIONS.variants.responsiveOrder,
    },
    whitespace: options.whitespace ?? DEFAULT_SORT_OPTIONS.whitespace,
  }
}

/**
 * Normalize a value before applying string comparison
 *
 * @param value Value to normalize
 * @param ignoreCase Whether letter casing is ignored
 * @param specialCharacters Special character behavior
 * @returns Normalized comparison value
 */
export function normalizeForComparison(
  value: string,
  ignoreCase: boolean,
  specialCharacters: SpecialCharacters,
): string {
  let normalized = value

  if (specialCharacters === 'trim') {
    normalized = normalized.replace(/^[^\p{L}\p{N}]+/u, '')
  } else if (specialCharacters === 'remove') {
    normalized = normalized.replaceAll(/[^\p{L}\p{N}]/gu, '')
  }

  return ignoreCase ? normalized.toLocaleLowerCase('en-US') : normalized
}

/**
 * Compare two strings by Unicode code point order
 *
 * @param left Left string
 * @param right Right string
 * @returns Numeric comparison result
 */
export function compareCodePoints(left: string, right: string): number {
  if (left === right) {
    return 0
  }

  return left < right ? -1 : 1
}
