import { filterFalsy, isTruthy } from '@ntnyq/utils'
import { collapseVariantGroup } from '@unocss/core'
import { createGroupDescriptors, isGroupOverride } from './group-descriptors'
import { createSortingNode } from './groups'
import type { AnalysisCollection } from './groups'
import { resolveSortOptions } from './options'
import type { ResolvedSortOptions } from './resolved-types'
import { sortNodes } from './sort-nodes'
import type { SortOptions } from './types'
import { createVariantGroupRanks, expandVariantGroups } from './variants'

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
