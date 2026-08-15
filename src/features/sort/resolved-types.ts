import type {
  CustomGroup,
  CustomVariantGroup,
  FallbackSort,
  GroupOption,
  SortOrder,
  SortType,
  SpecialCharacters,
  WhitespaceMode,
} from './types'

/**
 * Fully resolved variant options used by the sorting engine
 */
export interface ResolvedVariantOptions {
  /**
   * Direction used to compare compound variant chains
   */
  compoundOrder: 'outer-first' | 'inner-first'

  /**
   * Resolved user-defined variant group matchers
   */
  customGroups: CustomVariantGroup[]

  /**
   * Resolved ordered variant groups
   */
  groups: (string | string[])[]

  /**
   * Placement of variants relative to utility groups
   */
  placement: 'grouped' | 'attached'

  /**
   * Strategy used to order responsive variants
   */
  responsiveOrder: 'theme' | 'source' | 'natural'
}

/**
 * Fully resolved ordering options used by the sorting engine
 */
export interface ResolvedSortOptions {
  /**
   * Alphabet used by the custom comparison strategy
   */
  alphabet: string

  /**
   * Resolved custom utility groups
   */
  customGroups: CustomGroup[]

  /**
   * Resolved secondary comparison
   */
  fallbackSort: FallbackSort

  /**
   * Resolved ordered utility groups
   */
  groups: GroupOption[]

  /**
   * Whether string comparisons ignore letter casing
   */
  ignoreCase: boolean

  /**
   * Locales used by collation-based comparisons
   */
  locales: string | string[]

  /**
   * Default direction used within utility groups
   */
  order: SortOrder

  /**
   * Whether each newline-delimited section is sorted independently
   */
  partitionByNewLine: boolean

  /**
   * Placement behavior for UnoCSS shortcuts
   */
  shortcuts: 'expanded' | 'preserve-position' | 'group'

  /**
   * Behavior applied to special characters before comparison
   */
  specialCharacters: SpecialCharacters

  /**
   * Default comparison strategy used within utility groups
   */
  type: SortType

  /**
   * Placement behavior for unrecognized utilities
   */
  unknown: 'preserve-position' | 'group'

  /**
   * Resolved variant ordering options
   */
  variants: ResolvedVariantOptions

  /**
   * Resolved whitespace behavior
   */
  whitespace: WhitespaceMode
}
