import { DEFAULT_SORT_OPTIONS } from './constants'
import { resolveSemanticProfile } from './profiles'
import type { ResolvedSortOptions } from './resolved-types'
import type { SortOptions } from './types'

export { resolveSemanticProfile } from './profiles'

/**
 * Merge user options with the built-in ordering defaults
 *
 * @param options User-facing ordering options
 * @returns Fully resolved ordering options
 */
export function resolveSortOptions(
  options: SortOptions = {},
): ResolvedSortOptions {
  const profile = options.profile ?? DEFAULT_SORT_OPTIONS.profile
  const orderVersion = options.orderVersion ?? DEFAULT_SORT_OPTIONS.orderVersion
  const semanticProfile = resolveSemanticProfile(profile, orderVersion)

  return {
    alphabet: options.alphabet ?? DEFAULT_SORT_OPTIONS.alphabet,
    customGroups: options.customGroups ?? [...semanticProfile.customGroups],
    fallbackSort: {
      ...DEFAULT_SORT_OPTIONS.fallbackSort,
      ...options.fallbackSort,
    },
    groups: options.groups ?? [...semanticProfile.groups],
    ignoreCase: options.ignoreCase ?? DEFAULT_SORT_OPTIONS.ignoreCase,
    locales: options.locales ?? DEFAULT_SORT_OPTIONS.locales,
    order: options.order ?? DEFAULT_SORT_OPTIONS.order,
    orderVersion,
    partitionByNewLine:
      options.partitionByNewLine ?? DEFAULT_SORT_OPTIONS.partitionByNewLine,
    profile,
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
        ...semanticProfile.variantCustomGroups,
      ],
      groups: options.variants?.groups ?? [...semanticProfile.variantGroups],
      placement:
        options.variants?.placement ?? DEFAULT_SORT_OPTIONS.variants.placement,
      responsiveOrder:
        options.variants?.responsiveOrder ??
        DEFAULT_SORT_OPTIONS.variants.responsiveOrder,
    },
    whitespace: options.whitespace ?? DEFAULT_SORT_OPTIONS.whitespace,
  }
}
