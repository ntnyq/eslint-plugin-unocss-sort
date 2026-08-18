import { filterFalsy, isNonEmptyString, toArray } from '@ntnyq/utils'
import type { UtilityAnalysis } from '../../uno/types'
import { SEMANTIC_PATTERNS } from './constants'
import { getGroupRank } from './group-descriptors'
import type { GroupDescriptor } from './group-descriptors'
import { matchesRegexOption } from './matchers'
import type { CustomGroup, CustomGroupMatch, RegexOption } from './types'

/**
 * CSS property patterns mapped to semantic utility groups
 */
const propertyGroups: readonly [RegExp, string][] = [
  [
    /^(?:visibility|overflow(?:-[xy])?$|object-|columns?$|float$|clear$|contain$|contain-intrinsic-|content-visibility$|break-(?:after|before|inside)$)/u,
    'layout',
  ],
  [
    /^(?:--un-border-spacing-|border-collapse$|border-spacing$|caption-side$|empty-cells$|table-layout$)/u,
    'table',
  ],
  [/^(?:position|inset|top|right|bottom|left|z-index)/u, 'position'],
  [/^display$/u, 'display'],
  [/^(?:flex|order$)/u, 'flex'],
  [/^(?:grid|grid-|column-|row-)/u, 'grid'],
  [/^(?:align-|justify-|place-)/u, 'alignment'],
  [/^(?:margin|padding|gap|scroll-margin|scroll-padding)/u, 'spacing'],
  [
    /^(?:width|height|inline-size|block-size|min-|max-|aspect-ratio)/u,
    'sizing',
  ],
  [
    /^(?:font|line-height|letter-spacing|text-|color$|white-space|word-|overflow-wrap$|hyphens|content$|list-style)/u,
    'typography',
  ],
  [/^background/u, 'background'],
  [/^(?:--un-mask-|(?:-webkit-)?mask(?:-|$))/u, 'mask'],
  [/^--un-divide-/u, 'divide'],
  [/^(?:border|outline|box-decoration)/u, 'border'],
  [/^(?:box-shadow|opacity|mix-blend|background-blend)/u, 'effects'],
  [/^(?:filter|backdrop-filter)/u, 'filters'],
  [/^(?:transform|translate|rotate|scale|perspective)/u, 'transform'],
  [/^(?:transition|view-transition)/u, 'transition'],
  [/^animation/u, 'animation'],
  [
    /^(?:--un-(?:accent|caret)-|(?:-webkit-)?appearance$|accent-color$|caret-color$|color-scheme$|field-sizing$)/u,
    'ui-behavior',
  ],
  [
    /^(?:cursor|pointer-events|resize|scroll-|touch-action|user-select)/u,
    'interactivity',
  ],
  [/^(?:fill|stroke)/u, 'svg'],
]

/**
 * Semantic groups that refine otherwise indistinguishable CSS properties
 */
const semanticPropertyGroupOverrides = new Map([
  ['divide', 'border'],
  ['table', 'display'],
])

/**
 * Resolve the semantic group for a generated CSS property
 *
 * @param property Generated CSS property
 * @returns Semantic utility group when recognized
 */
function getPropertyGroup(property: string): string | undefined {
  return propertyGroups.find(([pattern]) => pattern.test(property))?.[1]
}

/**
 * Resolve semantic metadata for a base utility
 *
 * @param base Base utility name
 * @returns Semantic group, property, and rank metadata
 */
export function getSemanticGroup(base: string): {
  group?: string
  property?: string
  rank: number
} {
  const rank = SEMANTIC_PATTERNS.findIndex(({ pattern }) => pattern.test(base))

  if (rank === -1) {
    return { rank: SEMANTIC_PATTERNS.length }
  }

  const matched = SEMANTIC_PATTERNS[rank]
  if (!matched) {
    return { rank: SEMANTIC_PATTERNS.length }
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
 * @param semanticGroup Semantic class-name group when already recognized
 * @returns Highest-priority matching group
 */
export function selectPropertyGroup(
  properties: string[],
  descriptors: Map<string, GroupDescriptor>,
  semanticGroup?: string,
): string | undefined {
  const candidates = properties.map(property => getPropertyGroup(property))
  const matchedGroups = filterFalsy(candidates)
  const [propertyGroup] = matchedGroups.toSorted(
    (left, right) =>
      getGroupRank(left, descriptors) - getGroupRank(right, descriptors),
  )

  if (
    semanticGroup &&
    propertyGroup &&
    semanticPropertyGroupOverrides.get(semanticGroup) === propertyGroup
  ) {
    return semanticGroup
  }

  return propertyGroup
}
