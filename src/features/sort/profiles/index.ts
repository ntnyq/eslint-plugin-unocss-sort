import type {
  SemanticOrderVersion,
  SemanticProfile,
} from '../semantic-profile-options'
import type { SemanticProfileDefinition } from './types'
import { WIND3_V1_PROFILE } from './wind3'

const semanticProfiles = new Map<
  string,
  Map<number, SemanticProfileDefinition>
>([['wind3', new Map([[1, WIND3_V1_PROFILE]])]])

/**
 * Resolve one supported semantic profile coordinate
 *
 * @param profile Semantic profile name
 * @param orderVersion Profile-scoped ordering version
 * @returns Complete semantic ordering definition
 */
export function resolveSemanticProfile(
  profile: SemanticProfile | string,
  orderVersion: SemanticOrderVersion | number,
): SemanticProfileDefinition {
  const definition = semanticProfiles.get(profile)?.get(orderVersion)
  if (!definition) {
    throw new Error(
      `[eslint-plugin-unocss-sort] Unsupported semantic profile: ${profile}@${orderVersion}.`,
    )
  }

  return definition
}

export { WIND3_V1_PROFILE } from './wind3'
export type { SemanticPattern, SemanticProfileDefinition } from './types'
