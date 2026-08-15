import {
  filterFalsy,
  isMap,
  isNonEmptyString,
  isRecord,
  isTruthy,
  toArray,
} from '@ntnyq/utils'
import { collapseVariantGroup, parseVariantGroup } from '@unocss/core'
import type { TResponsiveVariant } from './constants'
import { RESPONSIVE_VARIANTS, SEMANTIC_PATTERNS } from './constants'
import type {
  CustomGroup,
  CustomGroupMatch,
  FallbackSort,
  GroupOption,
  GroupOverride,
  RegexOption,
  ResolvedSortOptions,
  SortOptions,
  SortOrder,
  SortType,
  UtilityAnalysis,
} from './types'
import {
  compareCodePoints,
  matchesRegexOption,
  normalizeForComparison,
  resolveSortOptions,
} from './utils'

interface GroupDescriptor {
  fallbackSort?: FallbackSort
  order?: SortOrder
  rank: number
  type?: SortType
}

interface VariantKey {
  group: string
  groupRank: number
  name: string
  responsiveRank: number
}

interface SortingNode {
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

type AnalysisCollection =
  | Map<string, UtilityAnalysis>
  | Record<string, UtilityAnalysis | undefined>

const emptyAnalysis: UtilityAnalysis = {
  properties: [],
  recognized: false,
  shortcut: false,
}

const propertyGroups: readonly [RegExp, string][] = [
  [/^(?:visibility|overflow|object-|columns?$)/u, 'layout'],
  [/^(?:position|inset|top|right|bottom|left|z-index)/u, 'position'],
  [/^display$/u, 'display'],
  [/^(?:flex|order$)/u, 'flex'],
  [/^(?:grid|grid-|column-|row-)/u, 'grid'],
  [/^(?:align-|justify-|place-)/u, 'alignment'],
  [/^(?:margin|padding|gap|scroll-margin|scroll-padding)/u, 'spacing'],
  [/^(?:width|height|min-|max-|aspect-ratio)/u, 'sizing'],
  [
    /^(?:font|line-height|letter-spacing|text-|color$|white-space|word-|hyphens|content$|list-style)/u,
    'typography',
  ],
  [/^background/u, 'background'],
  [/^(?:border|outline|box-decoration)/u, 'border'],
  [/^(?:box-shadow|opacity|mix-blend|background-blend)/u, 'effects'],
  [/^(?:filter|backdrop-filter)/u, 'filters'],
  [/^(?:transform|translate|rotate|scale|perspective)/u, 'transform'],
  [/^transition/u, 'transition'],
  [/^animation/u, 'animation'],
  [
    /^(?:cursor|pointer-events|resize|scroll-|touch-action|user-select|appearance|accent-color|caret-color)/u,
    'interactivity',
  ],
  [/^(?:fill|stroke)/u, 'svg'],
]

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
 * Check whether a group option overrides sorting behavior
 *
 * @param option Group option to inspect
 * @returns Whether the option is a group override
 */
function isGroupOverride(option: GroupOption): option is GroupOverride {
  return isRecord(option)
}

/**
 * Get every group name represented by a group option
 *
 * @param option Group option to inspect
 * @returns Group names represented by the option
 */
function getGroupNames(option: GroupOption): string[] {
  return isGroupOverride(option) ? toArray(option.group) : toArray(option)
}

/**
 * Create lookup descriptors for configured utility groups
 *
 * @param groups Ordered utility group options
 * @returns Descriptor lookup keyed by group name
 */
function createGroupDescriptors(
  groups: GroupOption[],
): Map<string, GroupDescriptor> {
  const descriptors = new Map<string, GroupDescriptor>()

  for (const [rank, option] of groups.entries()) {
    const override = isGroupOverride(option) ? option : undefined

    for (const group of getGroupNames(option)) {
      descriptors.set(group, {
        rank,
        ...(override?.fallbackSort && {
          fallbackSort: override.fallbackSort,
        }),
        ...(override?.order && { order: override.order }),
        ...(override?.type && { type: override.type }),
      })
    }
  }

  return descriptors
}

/**
 * Split a utility token into its base utility and variants
 *
 * @param raw Utility token to split
 * @returns Base utility and ordered variant names
 */
function splitVariants(raw: string): { base: string; variants: string[] } {
  const parts: string[] = []
  let current = ''
  let bracketDepth = 0
  let parenthesisDepth = 0
  let quote: '"' | "'" | undefined = undefined
  let isEscaped = false

  for (const character of raw) {
    if (isEscaped) {
      current += character
      isEscaped = false
    } else if (character === '\\') {
      current += character
      isEscaped = true
    } else if (quote) {
      current += character
      if (character === quote) {
        quote = undefined
      }
    } else if (character === '"' || character === "'") {
      current += character
      quote = character
    } else {
      if (character === '[') {
        bracketDepth += 1
      } else if (character === ']') {
        bracketDepth = Math.max(0, bracketDepth - 1)
      } else if (character === '(') {
        parenthesisDepth += 1
      } else if (character === ')') {
        parenthesisDepth = Math.max(0, parenthesisDepth - 1)
      }

      if (character === ':' && bracketDepth === 0 && parenthesisDepth === 0) {
        parts.push(current)
        current = ''
      } else {
        current += character
      }
    }
  }

  parts.push(current)

  return {
    base: (parts.pop() ?? raw).replace(/^!/u, '').replace(/!$/u, ''),
    variants: filterFalsy(parts),
  }
}

/**
 * Get the configured rank for a utility group
 *
 * @param group Utility group name
 * @param descriptors Descriptor lookup keyed by group name
 * @returns Configured rank or a rank after known groups
 */
function getGroupRank(
  group: string,
  descriptors: Map<string, GroupDescriptor>,
): number {
  return descriptors.get(group)?.rank ?? descriptors.size + 1
}

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
function getSemanticGroup(base: string): {
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
function isArbitraryProperty(base: string): boolean {
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
function matchesCustomGroup(
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
 * @returns Highest-priority matching group
 */
function selectPropertyGroup(
  properties: string[],
  descriptors: Map<string, GroupDescriptor>,
): string | undefined {
  const candidates = properties.map(property => getPropertyGroup(property))
  const matchedGroups = filterFalsy(candidates)

  return matchedGroups.toSorted(
    (left, right) =>
      getGroupRank(left, descriptors) - getGroupRank(right, descriptors),
  )[0]
}

/**
 * Classify a variant and calculate its sorting ranks
 *
 * @param variant Variant name
 * @param options Resolved ordering options
 * @param groupRanks Variant group rank lookup
 * @param originalIndex Original utility position
 * @param breakpoints Analyzed responsive breakpoint ranks
 * @returns Classified variant sorting key
 */
function classifyVariant(
  variant: string,
  options: ResolvedSortOptions,
  groupRanks: Map<string, number>,
  originalIndex: number,
  breakpoints?: Record<string, number>,
): VariantKey {
  const customGroup = options.variants.customGroups.find(group =>
    matchesRegexOption(variant, group.variantNamePattern),
  )

  let group = customGroup?.groupName
  if (!group) {
    if (variant === 'dark' || variant === 'light') {
      group = 'theme'
    } else if (
      variant in (breakpoints ?? {}) ||
      RESPONSIVE_VARIANTS.includes(variant as TResponsiveVariant)
    ) {
      group = 'responsive'
    } else if (variant.startsWith('@')) {
      group = variant.startsWith('@[') ? 'arbitrary' : 'container'
    } else if (variant === 'group' || variant.startsWith('group-')) {
      group = 'group'
    } else if (variant === 'peer' || variant.startsWith('peer-')) {
      group = 'peer'
    } else if (
      /^(?:hover|focus|focus-within|focus-visible|active|visited|target|checked|indeterminate|default|required|valid|invalid|in-range|out-of-range|placeholder-shown|autofill|read-only|open|disabled|enabled)$/u.test(
        variant,
      )
    ) {
      group = 'state'
    } else if (
      /^(?:before|after|first-letter|first-line|marker|selection|file|placeholder)$/u.test(
        variant,
      )
    ) {
      group = 'pseudo-element'
    } else if (/^(?:supports-|print$)/u.test(variant)) {
      group = 'at-rule'
    } else if (variant.startsWith('[')) {
      group = 'arbitrary'
    } else {
      group = 'unknown'
    }
  }

  const responsiveIndex = RESPONSIVE_VARIANTS.indexOf(
    variant as TResponsiveVariant,
  )
  let responsiveRank =
    breakpoints?.[variant] ??
    (responsiveIndex === -1 ? Number.MAX_SAFE_INTEGER : responsiveIndex)

  if (options.variants.responsiveOrder === 'source') {
    responsiveRank = originalIndex
  } else if (options.variants.responsiveOrder === 'natural') {
    responsiveRank = 0
  }

  return {
    group,
    groupRank: groupRanks.get(group) ?? groupRanks.size + 1,
    name: variant,
    responsiveRank,
  }
}

/**
 * Create a rank lookup for configured variant groups
 *
 * @param groups Ordered variant group names
 * @returns Rank lookup keyed by variant group name
 */
function createVariantGroupRanks(
  groups: (string | string[])[],
): Map<string, number> {
  const ranks = new Map<string, number>()

  for (const [rank, option] of groups.entries()) {
    const names = toArray(option)
    for (const name of names) {
      ranks.set(name, rank)
    }
  }

  return ranks
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
function createSortingNode(
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

/**
 * Apply the configured direction to a comparison result
 *
 * @param result Original comparison result
 * @param order Configured sort direction
 * @returns Direction-adjusted comparison result
 */
function compareWithOrder(result: number, order: SortOrder): number {
  return order === 'desc' ? -result : result
}

/**
 * Compare two strings using a custom alphabet
 *
 * @param left Left string
 * @param right Right string
 * @param alphabet Custom alphabet
 * @returns Numeric comparison result
 */
function compareCustomAlphabet(
  left: string,
  right: string,
  alphabet: string,
): number {
  const ranks = new Map(
    [...alphabet].map((character, index) => [character, index]),
  )
  const leftCharacters = [...left]
  const rightCharacters = [...right]
  const length = Math.max(leftCharacters.length, rightCharacters.length)

  for (let index = 0; index < length; index += 1) {
    const leftCharacter = leftCharacters[index]
    const rightCharacter = rightCharacters[index]
    if (leftCharacter !== rightCharacter) {
      if (leftCharacter === undefined) {
        return -1
      }
      if (rightCharacter === undefined) {
        return 1
      }

      const leftRank = ranks.get(leftCharacter) ?? alphabet.length
      const rightRank = ranks.get(rightCharacter) ?? alphabet.length
      if (leftRank !== rightRank) {
        return leftRank - rightRank
      }

      const codePointResult = compareCodePoints(leftCharacter, rightCharacter)
      if (codePointResult !== 0) {
        return codePointResult
      }
    }
  }

  return 0
}

/**
 * Compare two sorting nodes with a configured sort type
 *
 * @param left Left sorting node
 * @param right Right sorting node
 * @param type Comparison strategy
 * @param options Resolved ordering options
 * @returns Numeric comparison result
 */
function compareByType(
  left: SortingNode,
  right: SortingNode,
  type: SortType,
  options: ResolvedSortOptions,
): number {
  const normalizedLeft = normalizeForComparison(
    left.raw,
    options.ignoreCase,
    options.specialCharacters,
  )
  const normalizedRight = normalizeForComparison(
    right.raw,
    options.ignoreCase,
    options.specialCharacters,
  )

  if (type === 'unsorted') {
    return left.originalIndex - right.originalIndex
  }

  if (type === 'semantic') {
    const rankResult = left.semanticRank - right.semanticRank
    if (rankResult !== 0) {
      return rankResult
    }

    return new Intl.Collator(options.locales, {
      numeric: true,
      sensitivity: options.ignoreCase ? 'base' : 'variant',
    }).compare(normalizedLeft, normalizedRight)
  }

  if (type === 'uno') {
    const layerResult =
      (left.analysis.layerOrder ?? 0) - (right.analysis.layerOrder ?? 0)
    if (layerResult !== 0) {
      return layerResult
    }

    const ruleResult =
      (left.analysis.unoOrder ?? Number.MAX_SAFE_INTEGER) -
      (right.analysis.unoOrder ?? Number.MAX_SAFE_INTEGER)
    if (ruleResult !== 0) {
      return ruleResult
    }

    return (left.analysis.metaSort ?? 0) - (right.analysis.metaSort ?? 0)
  }

  if (type === 'natural' || type === 'alphabetical') {
    return new Intl.Collator(options.locales, {
      numeric: type === 'natural',
      sensitivity: options.ignoreCase ? 'base' : 'variant',
    }).compare(normalizedLeft, normalizedRight)
  }

  if (type === 'custom') {
    return compareCustomAlphabet(
      normalizedLeft,
      normalizedRight,
      options.alphabet,
    )
  }

  return compareCodePoints(normalizedLeft, normalizedRight)
}

/**
 * Compare two sorting nodes with the fallback strategy
 *
 * @param left Left sorting node
 * @param right Right sorting node
 * @param fallback Fallback comparison configuration
 * @param options Resolved ordering options
 * @returns Numeric comparison result
 */
function compareFallback(
  left: SortingNode,
  right: SortingNode,
  fallback: FallbackSort,
  options: ResolvedSortOptions,
): number {
  return compareWithOrder(
    compareByType(left, right, fallback.type, options),
    fallback.order ?? 'asc',
  )
}

/**
 * Compare the variant chains of two sorting nodes
 *
 * @param left Left sorting node
 * @param right Right sorting node
 * @param options Resolved ordering options
 * @returns Numeric comparison result
 */
function compareVariants(
  left: SortingNode,
  right: SortingNode,
  options: ResolvedSortOptions,
): number {
  const leftVariants =
    options.variants.compoundOrder === 'inner-first'
      ? left.variants.toReversed()
      : left.variants
  const rightVariants =
    options.variants.compoundOrder === 'inner-first'
      ? right.variants.toReversed()
      : right.variants

  const length = Math.max(leftVariants.length, rightVariants.length)
  for (let index = 0; index < length; index += 1) {
    const leftVariant = leftVariants[index]
    const rightVariant = rightVariants[index]

    if (!leftVariant) {
      return -1
    }
    if (!rightVariant) {
      return 1
    }

    const groupResult = leftVariant.groupRank - rightVariant.groupRank
    if (groupResult !== 0) {
      return groupResult
    }

    if (
      leftVariant.group === 'responsive' &&
      rightVariant.group === 'responsive'
    ) {
      const responsiveResult =
        leftVariant.responsiveRank - rightVariant.responsiveRank
      if (responsiveResult !== 0) {
        return responsiveResult
      }
    }

    const nameResult = compareCodePoints(leftVariant.name, rightVariant.name)
    if (nameResult !== 0) {
      return nameResult
    }
  }

  return 0
}

/**
 * Find a custom group by its configured name
 *
 * @param groupName Custom group name
 * @param customGroups Configured custom groups
 * @returns Matching custom group when present
 */
function getCustomGroup(
  groupName: string,
  customGroups: CustomGroup[],
): CustomGroup | undefined {
  return customGroups.find(group => group.groupName === groupName)
}

/**
 * Compare two nodes using variant, group, primary, and fallback rules
 *
 * @param left Left sorting node
 * @param right Right sorting node
 * @param options Resolved ordering options
 * @param descriptors Descriptor lookup keyed by group name
 * @returns Numeric comparison result
 */
function compareNodes(
  left: SortingNode,
  right: SortingNode,
  options: ResolvedSortOptions,
  descriptors: Map<string, GroupDescriptor>,
): number {
  const variantResult = compareVariants(left, right, options)
  const groupResult = left.groupRank - right.groupRank

  if (options.variants.placement === 'grouped') {
    if (variantResult !== 0) {
      return variantResult
    }
    if (groupResult !== 0) {
      return groupResult
    }
  } else {
    if (groupResult !== 0) {
      return groupResult
    }
    if (variantResult !== 0) {
      return variantResult
    }
  }

  const descriptor =
    left.group === right.group ? descriptors.get(left.group) : undefined
  const customGroup =
    left.group === right.group
      ? getCustomGroup(left.group, options.customGroups)
      : undefined
  const type = descriptor?.type ?? customGroup?.type ?? options.type
  const order = descriptor?.order ?? customGroup?.order ?? options.order
  const primaryResult = compareWithOrder(
    compareByType(left, right, type, options),
    order,
  )

  if (primaryResult !== 0) {
    return primaryResult
  }

  const fallback =
    descriptor?.fallbackSort ??
    customGroup?.fallbackSort ??
    options.fallbackSort
  const fallbackResult = compareFallback(left, right, fallback, options)
  if (fallbackResult !== 0) {
    return fallbackResult
  }

  const codePointResult = compareCodePoints(left.raw, right.raw)
  if (codePointResult !== 0) {
    return codePointResult
  }

  return left.originalIndex - right.originalIndex
}

/**
 * Sort nodes while preserving the position of pinned nodes
 *
 * @param nodes Sorting nodes
 * @param options Resolved ordering options
 * @param descriptors Descriptor lookup keyed by group name
 * @returns Sorted nodes
 */
function sortNodes(
  nodes: SortingNode[],
  options: ResolvedSortOptions,
  descriptors: Map<string, GroupDescriptor>,
): SortingNode[] {
  const result: SortingNode[] = []
  let partition: SortingNode[] = []

  /**
   * Sort and append the current movable partition
   */
  const flushPartition = () => {
    result.push(
      ...partition.toSorted((left, right) =>
        compareNodes(left, right, options, descriptors),
      ),
    )
    partition = []
  }

  for (const node of nodes) {
    if (node.pinned) {
      flushPartition()
      result.push(node)
    } else {
      partition.push(node)
    }
  }
  flushPartition()

  return result
}

/**
 * Expand UnoCSS variant group syntax without throwing on invalid input
 *
 * @param input Class list containing optional variant groups
 * @returns Expanded class list and prefixes used for collapsing
 */
function expandVariantGroups(input: string): {
  expanded: string
  prefixes: string[]
} {
  try {
    return parseVariantGroup(input)
  } catch {
    return { expanded: input, prefixes: [] }
  }
}

/**
 * Sort one whitespace-preserving class list partition
 *
 * @param input Class list partition
 * @param options Resolved ordering options
 * @param analyses Collected UnoCSS analysis metadata
 * @returns Sorted partition with surrounding whitespace preserved
 */
function sortPartition(
  input: string,
  options: ResolvedSortOptions,
  analyses?: AnalysisCollection,
): string {
  const leadingWhitespace = input.match(/^\s*/u)?.[0] ?? ''
  const trailingWhitespace = input.match(/\s*$/u)?.[0] ?? ''
  const content = input.slice(
    leadingWhitespace.length,
    input.length - trailingWhitespace.length,
  )

  if (!content) {
    return input
  }

  const expandedResult = expandVariantGroups(content)
  const tokens = filterFalsy(expandedResult.expanded.split(/\s+/u))
  const descriptors = createGroupDescriptors(options.groups)
  const variantGroupRanks = createVariantGroupRanks(options.variants.groups)
  const nodes = tokens.map((raw, originalIndex) =>
    createSortingNode(
      raw,
      originalIndex,
      options,
      descriptors,
      variantGroupRanks,
      analyses,
    ),
  )
  let sorted = sortNodes(nodes, options, descriptors)
    .map(node => node.raw)
    .join(' ')

  if (expandedResult.prefixes.length > 0) {
    sorted = collapseVariantGroup(sorted, expandedResult.prefixes)
  }

  if (options.whitespace === 'preserve') {
    const whitespace = [...content.matchAll(/\s+/gu)].map(match => match[0])
    const sortedTokens = filterFalsy(sorted.split(/\s+/u))

    if (whitespace.length === sortedTokens.length - 1) {
      sorted = sortedTokens
        .map((token, index) => `${token}${whitespace[index] ?? ''}`)
        .join('')
    }
  }

  return `${leadingWhitespace}${sorted}${trailingWhitespace}`
}

/**
 * Extract expanded utility tokens from a class list
 *
 * @param input Class list
 * @returns Expanded utility tokens
 */
export function getClassTokens(input: string): string[] {
  return filterFalsy(expandVariantGroups(input).expanded.split(/\s+/u))
}

/**
 * Check whether sorting options require UnoCSS runtime analysis
 *
 * @param options User-facing ordering options
 * @returns Whether UnoCSS runtime analysis is required
 */
export function requiresUnoAnalysis(options: SortOptions): boolean {
  if (options.type === 'uno') {
    return true
  }

  const groupOverrides = options.groups?.filter(isGroupOverride) ?? []
  if (groupOverrides.some(group => group.type === 'uno')) {
    return true
  }

  if (
    options.shortcuts === 'group' ||
    options.shortcuts === 'preserve-position' ||
    options.variants?.responsiveOrder === 'theme'
  ) {
    return true
  }

  return isTruthy(
    options.customGroups?.some(group => {
      if (group.type === 'uno') {
        return true
      }

      const matches = 'anyOf' in group ? group.anyOf : [group]
      return matches.some(
        match =>
          isTruthy(match.cssPropertyPattern) ||
          isTruthy(match.layer) ||
          match.recognized !== undefined ||
          match.shortcut !== undefined,
      )
    }),
  )
}

/**
 * Sort a class list with the configured UnoCSS ordering behavior
 *
 * @param input Class list to sort
 * @param options User-facing ordering options
 * @param analyses Collected UnoCSS analysis metadata
 * @returns Sorted class list
 */
export function sortClassList(
  input: string,
  options: SortOptions = {},
  analyses?: AnalysisCollection,
): string {
  const resolvedOptions = resolveSortOptions(options)

  if (!resolvedOptions.partitionByNewLine) {
    return sortPartition(input, resolvedOptions, analyses)
  }

  return input
    .split(/(?<newLine>\r?\n)/u)
    .map(partition =>
      /\r?\n/u.test(partition)
        ? partition
        : sortPartition(partition, resolvedOptions, analyses),
    )
    .join('')
}
