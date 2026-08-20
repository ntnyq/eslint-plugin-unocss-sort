import type { SortingNode } from './groups'
import type { ResolvedSortOptions } from './resolved-types'
import type {
  FallbackSort,
  SortOrder,
  SortType,
  SpecialCharacters,
} from './types'

/**
 * Normalize a value before applying string comparison
 *
 * @param value Value to normalize
 * @param ignoreCase Whether letter casing is ignored
 * @param specialCharacters Special character behavior
 * @returns Normalized comparison value
 */
export function normalizeForComparison(
  value: string,
  ignoreCase: boolean,
  specialCharacters: SpecialCharacters,
): string {
  let normalized = value

  if (specialCharacters === 'trim') {
    normalized = normalized.replace(/^[^\p{L}\p{N}]+/u, '')
  } else if (specialCharacters === 'remove') {
    normalized = normalized.replaceAll(/[^\p{L}\p{N}]/gu, '')
  }

  return ignoreCase ? normalized.toLocaleLowerCase('en-US') : normalized
}

/**
 * Compare two strings by Unicode code point order
 *
 * @param left Left string
 * @param right Right string
 * @returns Numeric comparison result
 */
export function compareCodePoints(left: string, right: string): number {
  if (left === right) {
    return 0
  }

  return left < right ? -1 : 1
}

/**
 * Apply the configured direction to a comparison result
 *
 * @param result Original comparison result
 * @param order Configured sort direction
 * @returns Direction-adjusted comparison result
 */
export function compareWithOrder(result: number, order: SortOrder): number {
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
export function compareByType(
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
    return (
      (left.analysis.officialOrder ?? Number.MAX_SAFE_INTEGER) -
      (right.analysis.officialOrder ?? Number.MAX_SAFE_INTEGER)
    )
  }

  if (type === 'uno-metadata') {
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
export function compareFallback(
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
