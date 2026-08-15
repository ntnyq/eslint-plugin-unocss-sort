import {
  compareByType,
  compareCodePoints,
  compareFallback,
  compareWithOrder,
} from './comparator'
import type { GroupDescriptor } from './group-descriptors'
import type { SortingNode } from './groups'
import type { ResolvedSortOptions } from './resolved-types'
import type { CustomGroup } from './types'

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
export function sortNodes(
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
