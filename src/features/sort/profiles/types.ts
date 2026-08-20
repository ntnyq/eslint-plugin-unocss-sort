import type {
  SemanticOrderVersion,
  SemanticProfile,
} from '../semantic-profile-options'
import type { CustomGroup, CustomVariantGroup, GroupOption } from '../types'

/**
 * One class-name pattern in a versioned semantic profile
 */
export interface SemanticPattern {
  group: string
  pattern: RegExp
  property: string
}

/**
 * Versioned semantic classification defaults owned by one profile coordinate
 */
export interface SemanticProfileDefinition {
  customGroups: CustomGroup[]
  groups: GroupOption[]
  name: SemanticProfile
  orderVersion: SemanticOrderVersion
  patterns: readonly SemanticPattern[]
  propertyGroups: readonly [RegExp, string][]
  propertyGroupOverrides: ReadonlyMap<string, string>
  responsiveVariants: readonly string[]
  variantCustomGroups: CustomVariantGroup[]
  variantGroups: (string | string[])[]
}
