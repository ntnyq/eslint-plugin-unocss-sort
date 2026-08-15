import { DEFAULT_SORT_OPTIONS, DEFAULT_VARIANT_GROUPS } from './constants'
import type { ResolvedSortOptions } from './resolved-types'
import type { SortOptions } from './types'

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
