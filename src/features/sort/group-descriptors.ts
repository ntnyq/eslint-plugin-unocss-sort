import { isRecord, toArray } from '@ntnyq/utils'
import type {
  FallbackSort,
  GroupOption,
  GroupOverride,
  SortOrder,
  SortType,
} from './types'

/**
 * Resolved sorting behavior and rank for one utility group
 */
export interface GroupDescriptor {
  fallbackSort?: FallbackSort
  order?: SortOrder
  rank: number
  type?: SortType
}

/**
 * Check whether a group option overrides sorting behavior
 *
 * @param option Group option to inspect
 * @returns Whether the option is a group override
 */
export function isGroupOverride(option: GroupOption): option is GroupOverride {
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
export function createGroupDescriptors(
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
 * Get the configured rank for a utility group
 *
 * @param group Utility group name
 * @param descriptors Descriptor lookup keyed by group name
 * @returns Configured rank or a rank after known groups
 */
export function getGroupRank(
  group: string,
  descriptors: Map<string, GroupDescriptor>,
): number {
  return descriptors.get(group)?.rank ?? descriptors.size + 1
}
