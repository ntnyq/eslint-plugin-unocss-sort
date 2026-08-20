import { filterFalsy, isString } from '@ntnyq/utils'
import { parseVariantGroup } from '@unocss/core'
import type { StringifiedUtil } from '@unocss/core'

/**
 * UnoCSS syntax details resolved for one recognized utility
 */
export interface UtilitySyntax {
  base?: string
  prefix?: string
  variants?: string[]
}

/**
 * Expand configured variant groups before utility analysis
 *
 * @param tokens Class-list fragments collected by the ESLint process
 * @param separators Resolved UnoCSS variant separators
 * @returns Expanded utility tokens
 */
export function expandAnalyzedTokens(
  tokens: string[],
  separators: string[],
): string[] {
  const { expanded } = parseVariantGroup(tokens.join(' '), separators)
  return filterFalsy(expanded.split(/\s+/u))
}

/**
 * Remove the separator terminating a variant segment
 *
 * @param affix Raw text removed by one UnoCSS variant handler
 * @param separators Resolved UnoCSS variant separators
 * @returns Variant name without its separator
 */
function removeVariantSeparator(affix: string, separators: string[]): string {
  const separator = separators
    .toSorted((left, right) => right.length - left.length)
    .find(candidate => affix.endsWith(candidate))

  return separator ? affix.slice(0, -separator.length) : affix
}

/**
 * Extract the text removed between two UnoCSS variant matcher states
 *
 * @param source Matcher before applying a variant
 * @param remainder Matcher after applying a variant
 * @returns Removed prefix or suffix
 */
function getVariantAffix(
  source: string,
  remainder: string,
): string | undefined {
  if (source.endsWith(remainder)) {
    return source.slice(0, -remainder.length)
  }
  if (source.startsWith(remainder)) {
    return source.slice(remainder.length)
  }

  return undefined
}

/**
 * Resolve the preset prefix that matched a parsed utility
 *
 * @param utility Utility selector after variant processing
 * @param prefixes Rule prefixes accepted by UnoCSS
 * @returns Longest matching prefix
 */
function getMatchedPrefix(
  utility: string,
  prefixes: string | string[] | undefined,
): string | undefined {
  let candidates: string[] = []
  if (Array.isArray(prefixes)) {
    candidates = prefixes
  } else if (prefixes) {
    candidates = [prefixes]
  }

  return candidates
    .toSorted((left, right) => right.length - left.length)
    .find(prefix => utility.startsWith(prefix))
}

/**
 * Derive semantic syntax from UnoCSS's resolved token details
 *
 * @param parsed Parsed UnoCSS utility
 * @param separators Resolved UnoCSS variant separators
 * @returns Base utility, matched preset prefix, and variant names
 */
export function getUtilitySyntax(
  parsed: StringifiedUtil,
  separators: string[],
): UtilitySyntax {
  const { 4: meta, 5: context } = parsed
  if (!context) {
    return {}
  }

  const prefix = getMatchedPrefix(context.currentSelector, meta?.prefix)
  const remainders = [
    context.rawSelector,
    ...context.variantHandlers
      .map(handler => handler.matcher)
      .filter((matcher): matcher is string => isString(matcher))
      .toReversed(),
  ]
  const variants: string[] = []

  for (let index = 0; index < remainders.length - 1; index += 1) {
    const [source, remainder] = remainders.slice(index, index + 2)
    if (source && remainder) {
      const affix = getVariantAffix(source, remainder)
      if (affix) {
        const variant = removeVariantSeparator(affix, separators)
        if (variant && variant !== '!' && variant !== '-') {
          variants.push(variant)
        }
      }
    }
  }

  const base = prefix
    ? context.currentSelector.slice(prefix.length)
    : context.currentSelector

  return {
    base,
    ...(prefix && { prefix }),
    variants,
  }
}
