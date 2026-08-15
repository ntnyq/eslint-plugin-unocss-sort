import { isNumber } from '@ntnyq/utils'
import { matchesRegexOption } from '../features/sort/matchers'
import type { AstNode } from './ast'
import { DEFAULT_TARGETS } from './target-constants'
import type {
  CalleeTargetSelector,
  TargetMatcher,
  TargetSelector,
} from './types'

/**
 * Normalize an attribute name to lowercase kebab case
 *
 * @param name Attribute name
 * @returns Normalized attribute name
 */
export function normalizeAttributeName(name: string): string {
  return name
    .replaceAll(
      /(?<lowercase>[a-z\d])(?<uppercase>[A-Z])/gu,
      '$<lowercase>-$<uppercase>',
    )
    .replaceAll('_', '-')
    .toLowerCase()
}

/**
 * Expression location categories supported by target matchers
 */
export type TargetValueKind = 'strings' | 'object-keys' | 'object-values'

/**
 * Resolve configured targets without exposing the mutable default array
 *
 * @param targets User-defined targets
 * @returns Configured or default target selectors
 */
export function resolveTargets(
  targets: TargetSelector[] | undefined,
): TargetSelector[] {
  return targets ?? [...DEFAULT_TARGETS]
}

/**
 * Check whether a selector matches a static source name
 *
 * @param target Target selector
 * @param name Static source name
 * @returns Whether the target matches the source name
 */
export function matchesTargetName(
  target: TargetSelector,
  name: string,
): boolean {
  if (target.kind !== 'attribute') {
    return matchesRegexOption(name, target.name)
  }

  return (
    matchesRegexOption(name, target.name) ||
    matchesRegexOption(normalizeAttributeName(name), target.name)
  )
}

/**
 * Check whether a target collects a string at one expression location
 *
 * @param target Target selector
 * @param kind Expression location kind
 * @param path Static object path
 * @returns Whether the location should be collected
 */
export function matchesTargetValue(
  target: TargetSelector,
  kind: TargetValueKind,
  path: string,
): boolean {
  const matchers: TargetMatcher[] = target.match ?? ['strings']

  return matchers.some(matcher => {
    if (matcher === 'strings') {
      return kind === 'strings'
    }

    return (
      matcher.type === kind &&
      (!matcher.path || matchesRegexOption(path, matcher.path))
    )
  })
}

/**
 * Select call arguments configured by a callee target
 *
 * @param target Callee target selector
 * @param callArguments Call arguments
 * @returns Selected call arguments
 */
export function selectTargetArguments(
  target: CalleeTargetSelector,
  callArguments: AstNode[],
): AstNode[] {
  const selection = target.arguments ?? 'all'
  if (selection === 'all') {
    return callArguments
  }

  let index = 0
  if (selection === 'last') {
    index = callArguments.length - 1
  } else if (isNumber(selection)) {
    index = selection < 0 ? callArguments.length + selection : selection
  }

  const argument = callArguments[index]
  return argument ? [argument] : []
}
