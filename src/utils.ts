import { isString } from '@ntnyq/utils'
import {
  builtinUnoAttributes,
  defaultOrderOptions,
  defaultVariantGroups,
} from './constants'
import type {
  OrderOptions,
  RegexOption,
  ResolvedOrderOptions,
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
 * Check whether an attribute contains UnoCSS utilities
 *
 * @param name Attribute name
 * @param customAttributes Additional attribute patterns
 * @returns Whether the attribute can contain UnoCSS utilities
 */
export function isUnoAttribute(
  name: string,
  customAttributes: RegexOption[],
): boolean {
  const normalizedName = normalizeAttributeName(name)

  return (
    builtinUnoAttributes.includes(
      normalizedName as (typeof builtinUnoAttributes)[number],
    ) ||
    customAttributes.some(
      pattern =>
        matchesRegexOption(name, pattern) ||
        matchesRegexOption(normalizedName, pattern),
    )
  )
}

/**
 * Merge user options with the built-in ordering defaults
 *
 * @param options User-facing ordering options
 * @returns Fully resolved ordering options
 */
export function resolveOrderOptions(
  options: OrderOptions = {},
): ResolvedOrderOptions {
  return {
    alphabet: options.alphabet ?? defaultOrderOptions.alphabet,
    customGroups: options.customGroups ?? [...defaultOrderOptions.customGroups],
    fallbackSort: {
      ...defaultOrderOptions.fallbackSort,
      ...options.fallbackSort,
    },
    groups: options.groups ?? [...defaultOrderOptions.groups],
    ignoreCase: options.ignoreCase ?? defaultOrderOptions.ignoreCase,
    locales: options.locales ?? defaultOrderOptions.locales,
    order: options.order ?? defaultOrderOptions.order,
    partitionByNewLine:
      options.partitionByNewLine ?? defaultOrderOptions.partitionByNewLine,
    shortcuts: options.shortcuts ?? defaultOrderOptions.shortcuts,
    specialCharacters:
      options.specialCharacters ?? defaultOrderOptions.specialCharacters,
    type: options.type ?? defaultOrderOptions.type,
    unknown: options.unknown ?? defaultOrderOptions.unknown,
    unoAttributes: options.unoAttributes ?? [],
    unoFunctions: options.unoFunctions ?? [...defaultOrderOptions.unoFunctions],
    unoVariables: options.unoVariables ?? [...defaultOrderOptions.unoVariables],
    variants: {
      compoundOrder:
        options.variants?.compoundOrder ??
        defaultOrderOptions.variants.compoundOrder,
      customGroups: options.variants?.customGroups ?? [
        ...defaultOrderOptions.variants.customGroups,
      ],
      groups: options.variants?.groups ?? [...defaultVariantGroups],
      placement:
        options.variants?.placement ?? defaultOrderOptions.variants.placement,
      responsiveOrder:
        options.variants?.responsiveOrder ??
        defaultOrderOptions.variants.responsiveOrder,
    },
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
