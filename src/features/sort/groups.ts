import { isMap, isTruthy } from '@ntnyq/utils'
import type { UtilityAnalysis } from '../../uno/types'
import { getGroupRank } from './group-descriptors'
import type { GroupDescriptor } from './group-descriptors'
import {
  getSemanticGroup,
  isArbitraryProperty,
  matchesCustomGroup,
  selectPropertyGroup,
} from './group-matchers'
import type { ResolvedSortOptions } from './resolved-types'
import { classifyVariant, splitVariants } from './variants'
import type { VariantKey } from './variants'

/**
 * Fully classified utility token used by the sorting engine
 */
export interface SortingNode {
  analysis: UtilityAnalysis
  base: string
  group: string
  groupRank: number
  originalIndex: number
  pinned: boolean
  raw: string
  semanticRank: number
  variants: VariantKey[]
}

/**
 * Supported lookup containers for precomputed UnoCSS analysis
 */
export type AnalysisCollection =
  | Map<string, UtilityAnalysis>
  | Record<string, UtilityAnalysis | undefined>

/**
 * Analysis fallback used when no UnoCSS metadata is available
 */
const emptyAnalysis: UtilityAnalysis = {
  properties: [],
  recognized: false,
  shortcut: false,
}

/**
 * Get the UnoCSS analysis for a utility token
 *
 * @param analyses Collected analysis metadata
 * @param raw Utility token
 * @returns Analysis metadata for the token
 */
function getAnalysis(
  analyses: AnalysisCollection | undefined,
  raw: string,
): UtilityAnalysis {
  if (!analyses) {
    return emptyAnalysis
  }

  return isMap<string, UtilityAnalysis>(analyses)
    ? (analyses.get(raw) ?? emptyAnalysis)
    : (analyses[raw] ?? emptyAnalysis)
}

/**
 * Create a sortable node for one utility token
 *
 * @param raw Utility token
 * @param originalIndex Original utility position
 * @param options Resolved ordering options
 * @param descriptors Descriptor lookup keyed by group name
 * @param variantGroupRanks Variant group rank lookup
 * @param analyses Collected UnoCSS analysis metadata
 * @returns Sortable utility node
 */
export function createSortingNode(
  raw: string,
  originalIndex: number,
  options: ResolvedSortOptions,
  descriptors: Map<string, GroupDescriptor>,
  variantGroupRanks: Map<string, number>,
  analyses?: AnalysisCollection,
): SortingNode {
  const { base, variants: variantNames } = splitVariants(raw)
  const analysis = getAnalysis(analyses, raw)
  const normalizedBase = base.startsWith('-') ? base.slice(1) : base
  const semantic = getSemanticGroup(normalizedBase)
  const arbitrary = isArbitraryProperty(normalizedBase)
  const recognized =
    analysis.recognized || isTruthy(semantic.group) || arbitrary
  const customGroup = options.customGroups.find(group =>
    matchesCustomGroup(group, {
      analysis,
      arbitrary,
      raw,
      recognized: analysis.recognized,
      variants: variantNames,
    }),
  )

  let group = customGroup?.groupName
  if (!group && analysis.shortcut && options.shortcuts === 'group') {
    group = 'shortcut'
  }
  if (!group && analysis.properties.length > 0) {
    group = selectPropertyGroup(analysis.properties, descriptors)
  }
  if (!group && arbitrary) {
    group = 'arbitrary-property'
  }
  if (!group) {
    group = semantic.group ?? (recognized ? 'known' : 'unknown')
  }

  const pinned =
    (group === 'unknown' && options.unknown === 'preserve-position') ||
    (analysis.shortcut && options.shortcuts === 'preserve-position')

  return {
    analysis,
    base,
    group,
    groupRank: getGroupRank(group, descriptors),
    originalIndex,
    pinned,
    raw,
    semanticRank: semantic.rank,
    variants: variantNames.map(variant =>
      classifyVariant(
        variant,
        options,
        variantGroupRanks,
        originalIndex,
        analysis.breakpoints,
      ),
    ),
  }
}
