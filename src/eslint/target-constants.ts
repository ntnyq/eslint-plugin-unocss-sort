import type { TargetSelector } from './types'

/**
 * Built-in attributes that can contain UnoCSS utilities
 */
export const BUILTIN_UNO_ATTRIBUTES = [
  'class',
  'class-name',
  'enter-class',
  'enter-from-class',
  'enter-active-class',
  'enter-to-class',
  'leave-class',
  'leave-from-class',
  'leave-active-class',
  'leave-to-class',
  'appear-class',
  'appear-from-class',
  'appear-active-class',
  'appear-to-class',
  'move-class',
] as const

/**
 * Default source locations that can contain UnoCSS utilities
 */
export const DEFAULT_TARGETS = [
  {
    kind: 'attribute',
    match: ['strings', { type: 'object-keys' }],
    name: `^(?:${BUILTIN_UNO_ATTRIBUTES.join('|')})$`,
  },
  {
    arguments: 'all',
    kind: 'callee',
    match: ['strings', { type: 'object-keys' }],
    name: { flags: 'i', pattern: '(?:^|\\.)(?:clsx|classnames)$' },
  },
  {
    kind: 'variable',
    match: ['strings', { type: 'object-values' }],
    name: { flags: 'i', pattern: '^cls' },
  },
  {
    kind: 'variable',
    match: ['strings', { type: 'object-values' }],
    name: { flags: 'i', pattern: 'classNames?$' },
  },
] satisfies TargetSelector[]
