import { filterFalsy, isNonEmptyString, toArray } from '@ntnyq/utils'
import type { UtilityAnalysis } from '../../uno/types'
import { getGroupRank } from './group-descriptors'
import type { GroupDescriptor } from './group-descriptors'
import { matchesRegexOption } from './matchers'
import type { SemanticProfileDefinition } from './profiles'
import type { CustomGroup, CustomGroupMatch, RegexOption } from './types'

/**
 * Resolve the semantic group for a generated CSS property
 *
 * @param property Generated CSS property
 * @param profile Resolved semantic ordering profile
 * @returns Semantic utility group when recognized
 */
function getPropertyGroup(
  property: string,
  profile: SemanticProfileDefinition,
): string | undefined {
  return profile.propertyGroups.find(([pattern]) => pattern.test(property))?.[1]
}

/**
 * Resolve semantic metadata for a base utility
 *
 * @param base Base utility name
 * @param profile Resolved semantic ordering profile
 * @returns Semantic group, property, and rank metadata
 */
export function getSemanticGroup(
  base: string,
  profile: SemanticProfileDefinition,
): {
  group?: string
  property?: string
  rank: number
} {
  const rank = profile.patterns.findIndex(({ pattern }) => pattern.test(base))

  if (rank === -1) {
    return { rank: profile.patterns.length }
  }

  const matched = profile.patterns[rank]
  if (!matched) {
    return { rank: profile.patterns.length }
  }
  return {
    group: matched.group,
    property: matched.property,
    rank,
  }
}

/**
 * Check whether a utility uses arbitrary property syntax
 *
 * @param base Base utility name
 * @returns Whether the utility is an arbitrary property
 */
export function isArbitraryProperty(base: string): boolean {
  return /^\[[^\]]+:.+\]$/u.test(base)
}

/**
 * Check whether an analyzed layer matches a configured layer
 *
 * @param actual Analyzed UnoCSS layer
 * @param expected Configured layer or layers
 * @returns Whether the analyzed layer matches
 */
function matchesLayer(
  actual: string | undefined,
  expected: string | string[],
): boolean {
  return isNonEmptyString(actual) && toArray(expected).includes(actual)
}

/**
 * Check every condition in one custom group matcher
 *
 * @param match Custom group conditions
 * @param data Utility metadata evaluated by the conditions
 * @returns Whether every configured condition matches
 */
function matchesCustomGroupPart(
  match: CustomGroupMatch,
  data: {
    analysis: UtilityAnalysis
    arbitrary: boolean
    raw: string
    recognized: boolean
    variants: string[]
  },
): boolean {
  const checks: boolean[] = []

  if (match.classNamePattern) {
    checks.push(matchesRegexOption(data.raw, match.classNamePattern))
  }
  if (match.cssPropertyPattern) {
    checks.push(
      data.analysis.properties.some(property =>
        matchesRegexOption(property, match.cssPropertyPattern as RegexOption),
      ),
    )
  }
  if (match.variantNamePattern) {
    checks.push(
      data.variants.some(variant =>
        matchesRegexOption(variant, match.variantNamePattern as RegexOption),
      ),
    )
  }
  if (match.layer) {
    checks.push(matchesLayer(data.analysis.layer, match.layer))
  }
  if (match.shortcut !== undefined) {
    checks.push(data.analysis.shortcut === match.shortcut)
  }
  if (match.arbitrary !== undefined) {
    checks.push(data.arbitrary === match.arbitrary)
  }
  if (match.recognized !== undefined) {
    checks.push(data.recognized === match.recognized)
  }

  return checks.length > 0 && checks.every(Boolean)
}

/**
 * Check whether utility metadata matches a custom group
 *
 * @param group Custom group configuration
 * @param data Utility metadata evaluated by the group
 * @returns Whether the custom group matches
 */
export function matchesCustomGroup(
  group: CustomGroup,
  data: Parameters<typeof matchesCustomGroupPart>[1],
): boolean {
  if ('anyOf' in group) {
    return group.anyOf.some(match => matchesCustomGroupPart(match, data))
  }

  return matchesCustomGroupPart(group, data)
}

/**
 * Select the highest-priority semantic group for CSS properties
 *
 * @param properties Generated CSS properties
 * @param descriptors Descriptor lookup keyed by group name
 * @param profile Resolved semantic ordering profile
 * @param semanticGroup Semantic class-name group when already recognized
 * @returns Highest-priority matching group
 */
export function selectPropertyGroup(
  properties: string[],
  descriptors: Map<string, GroupDescriptor>,
  profile: SemanticProfileDefinition,
  semanticGroup?: string,
): string | undefined {
  const candidates = properties.map(property =>
    getPropertyGroup(property, profile),
  )
  const matchedGroups = filterFalsy(candidates)
  const [propertyGroup] = matchedGroups.toSorted(
    (left, right) =>
      getGroupRank(left, descriptors) - getGroupRank(right, descriptors),
  )

  if (
    semanticGroup &&
    propertyGroup &&
    profile.propertyGroupOverrides.get(semanticGroup) === propertyGroup
  ) {
    return semanticGroup
  }

  return propertyGroup
}
