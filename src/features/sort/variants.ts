import { filterFalsy, toArray } from '@ntnyq/utils'
import { parseVariantGroup } from '@unocss/core'
import { matchesRegexOption } from './matchers'
import type { SemanticProfileDefinition } from './profiles'
import type { ResolvedSortOptions } from './resolved-types'

/**
 * Comparable classification metadata for one variant segment
 */
export interface VariantKey {
  group: string
  groupRank: number
  name: string
  responsiveRank: number
}

/**
 * Split a utility token into its base utility and variants
 *
 * @param raw Utility token to split
 * @param separators Optional UnoCSS variant separators
 * @returns Base utility and ordered variant names
 */
export function splitVariants(
  raw: string,
  separators?: string[],
): {
  base: string
  variants: string[]
} {
  const parts: string[] = []
  let current = ''
  let bracketDepth = 0
  let parenthesisDepth = 0
  let quote: '"' | "'" | undefined = undefined
  let isEscaped = false

  const variantSeparators = (separators ?? [':'])
    .filter(separator => separator !== '-')
    .toSorted((left, right) => right.length - left.length)

  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index] ?? ''
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

      const separator =
        bracketDepth === 0 && parenthesisDepth === 0
          ? variantSeparators.find(candidate =>
              raw.startsWith(candidate, index),
            )
          : undefined

      if (separator) {
        parts.push(current)
        current = ''
        index += separator.length - 1
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
 * Classify a variant and calculate its sorting ranks
 *
 * @param variant Variant name
 * @param options Resolved ordering options
 * @param groupRanks Variant group rank lookup
 * @param originalIndex Original utility position
 * @param profile Resolved semantic ordering profile
 * @param breakpoints Analyzed responsive breakpoint ranks
 * @returns Classified variant sorting key
 */
export function classifyVariant(
  variant: string,
  options: ResolvedSortOptions,
  groupRanks: Map<string, number>,
  originalIndex: number,
  profile: SemanticProfileDefinition,
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
      profile.responsiveVariants.includes(variant)
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

  const responsiveIndex = profile.responsiveVariants.indexOf(variant)
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
export function createVariantGroupRanks(
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
 * Expand UnoCSS variant group syntax without throwing on invalid input
 *
 * @param input Class list containing optional variant groups
 * @param separators Optional UnoCSS variant separators
 * @returns Expanded class list and prefixes used for collapsing
 */
export function expandVariantGroups(
  input: string,
  separators?: string[],
): {
  expanded: string
  prefixes: string[]
} {
  try {
    return parseVariantGroup(input, separators)
  } catch {
    return { expanded: input, prefixes: [] }
  }
}
