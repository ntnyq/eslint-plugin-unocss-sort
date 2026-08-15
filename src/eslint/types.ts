import type { RegexOption, SortOptions } from '../features/sort/types'

/**
 * UnoCSS runtime analysis behavior used by the ESLint rule
 */
export type AnalysisMode = 'auto' | 'always' | 'never'

/**
 * String locations collected while traversing a configured target
 */
export type TargetMatcher =
  | 'strings'
  | {
      /**
       * Optional object path pattern used to narrow matching
       */
      path?: RegexOption

      /**
       * Object location whose strings are collected
       */
      type: 'object-keys' | 'object-values'
    }

/**
 * Fields shared by every source target selector
 */
export interface TargetSelectorBase {
  /**
   * String locations collected below the target
   */
  match?: TargetMatcher[]

  /**
   * Name pattern used to select the source location
   */
  name: RegexOption
}

/**
 * Attribute and property names whose values contain class lists
 */
export interface AttributeTargetSelector extends TargetSelectorBase {
  kind: 'attribute'
}

/**
 * Function calls whose selected arguments contain class lists
 */
export interface CalleeTargetSelector extends TargetSelectorBase {
  /**
   * Argument selection. Negative indexes count from the end.
   */
  arguments?: 'all' | 'first' | 'last' | number

  kind: 'callee'
}

/**
 * Tagged templates whose static parts contain class lists
 */
export interface TagTargetSelector extends TargetSelectorBase {
  kind: 'tag'
}

/**
 * Variables whose initializers contain class lists
 */
export interface VariableTargetSelector extends TargetSelectorBase {
  kind: 'variable'
}

/**
 * Source target supported by class-list rules
 */
export type TargetSelector =
  | AttributeTargetSelector
  | CalleeTargetSelector
  | TagTargetSelector
  | VariableTargetSelector

/**
 * User-facing options for the UnoCSS class ordering rule
 */
export interface OrderOptions extends SortOptions {
  /**
   * Whether the rule loads UnoCSS runtime metadata
   */
  analysis?: AnalysisMode

  /**
   * Source locations that contain UnoCSS class lists
   */
  targets?: TargetSelector[]
}

/**
 * User-facing options for the duplicate-class rule
 */
export interface NoDuplicateClassesOptions {
  /**
   * Source locations that contain UnoCSS class lists
   */
  targets?: TargetSelector[]
}
