import { ruleNoDuplicateClasses } from './no-duplicate-classes'
import { ruleOrder } from './order'

export { ruleNoDuplicateClasses } from './no-duplicate-classes'
export { ruleOrder } from './order'

/**
 * Rule implementations keyed by their public ESLint rule names
 */
export const rules = {
  'no-duplicate-classes': ruleNoDuplicateClasses,
  order: ruleOrder,
}
