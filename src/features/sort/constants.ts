import { WIND3_V1_PROFILE } from './profiles'
import type { SortOptions } from './types'

/**
 * Default semantic order for utility groups
 */
export const DEFAULT_GROUPS = structuredClone(WIND3_V1_PROFILE.groups)

/**
 * Default order for UnoCSS variant groups
 */
export const DEFAULT_VARIANT_GROUPS = structuredClone(
  WIND3_V1_PROFILE.variantGroups,
)

/**
 * Complete default options used by the ordering rule
 */
export const DEFAULT_SORT_OPTIONS = {
  alphabet: '',
  customGroups: structuredClone(WIND3_V1_PROFILE.customGroups),
  fallbackSort: {
    order: 'asc',
    type: 'code-point',
  },
  groups: DEFAULT_GROUPS,
  ignoreCase: false,
  locales: 'en-US',
  order: 'asc',
  orderVersion: WIND3_V1_PROFILE.orderVersion,
  partitionByNewLine: true,
  profile: WIND3_V1_PROFILE.name,
  shortcuts: 'expanded',
  specialCharacters: 'keep',
  type: 'semantic',
  unknown: 'preserve-position',
  variants: {
    compoundOrder: 'outer-first',
    customGroups: structuredClone(WIND3_V1_PROFILE.variantCustomGroups),
    groups: DEFAULT_VARIANT_GROUPS,
    placement: 'grouped',
    responsiveOrder: 'theme',
  },
  whitespace: 'preserve',
} satisfies SortOptions
