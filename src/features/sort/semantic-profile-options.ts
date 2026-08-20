/**
 * Built-in semantic classification profile
 */
export type SemanticProfile = 'wind3'

/**
 * Profile-scoped semantic ordering protocol version
 */
export type SemanticOrderVersion = 1

/**
 * Coordinates selecting one immutable semantic ordering protocol
 */
export interface SemanticProfileOptions {
  /** Version of the selected semantic ordering protocol */
  orderVersion?: SemanticOrderVersion

  /** Semantic classification behavior used by plugin-defined group modes */
  profile?: SemanticProfile
}
