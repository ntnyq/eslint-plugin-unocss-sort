import type { SortOptions, TargetSelector } from './types'

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
 * Default semantic order for utility groups
 */
export const DEFAULT_GROUPS = [
  'layout',
  'position',
  'display',
  ['flex', 'grid', 'alignment'],
  'spacing',
  'sizing',
  'typography',
  ['background', 'border'],
  ['effects', 'filters'],
  ['transform', 'transition', 'animation'],
  'interactivity',
  'icons',
  ['svg', 'accessibility'],
  'arbitrary-property',
  'shortcut',
  'known',
  'unknown',
] satisfies NonNullable<SortOptions['groups']>

/**
 * Default order for UnoCSS variant groups
 */
export const DEFAULT_VARIANT_GROUPS = [
  'base',
  'theme',
  'responsive',
  'container',
  ['group', 'peer'],
  'state',
  'pseudo-element',
  'at-rule',
  'arbitrary',
  'unknown',
] satisfies NonNullable<NonNullable<SortOptions['variants']>['groups']>

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

/**
 * Complete default options used by the ordering rule
 */
export const DEFAULT_SORT_OPTIONS = {
  alphabet: '',
  customGroups: [
    {
      anyOf: [
        { classNamePattern: '^i-' },
        { cssPropertyPattern: '^(fill|stroke)$' },
      ],
      groupName: 'icons',
      type: 'natural',
    },
  ],
  fallbackSort: {
    order: 'asc',
    type: 'code-point',
  },
  groups: DEFAULT_GROUPS,
  ignoreCase: false,
  locales: 'en-US',
  order: 'asc',
  partitionByNewLine: true,
  shortcuts: 'expanded',
  specialCharacters: 'keep',
  type: 'semantic',
  unknown: 'preserve-position',
  variants: {
    compoundOrder: 'outer-first',
    customGroups: [
      {
        groupName: 'theme',
        variantNamePattern: '^(dark|light)$',
      },
      {
        groupName: 'state',
        variantNamePattern:
          '^(hover|focus|focus-visible|active|visited|checked|disabled)$',
      },
    ],
    groups: DEFAULT_VARIANT_GROUPS,
    placement: 'grouped',
    responsiveOrder: 'theme',
  },
  whitespace: 'preserve',
} satisfies SortOptions

/**
 * Semantic utility patterns used when UnoCSS analysis is unavailable
 */
export const SEMANTIC_PATTERNS: readonly {
  group: string
  pattern: RegExp
  property: string
}[] = [
  {
    group: 'layout',
    pattern:
      /^(?:container|box-|box$|columns?-|break-|object-|overflow|overscroll|visible$|invisible$|collapse$|isolate$|isolation-)/u,
    property: 'layout',
  },
  {
    group: 'position',
    pattern:
      /^(?:static|fixed|absolute|relative|sticky|inset|top-|right-|bottom-|left-|start-|end-|z-)/u,
    property: 'position',
  },
  {
    group: 'display',
    pattern:
      /^(?:hidden|block|inline(?:-block|-flex|-grid|-table)?|flow-root|contents|list-item|table(?:-.+)?|flex$|grid$)/u,
    property: 'display',
  },
  {
    group: 'flex',
    pattern: /^(?:flex-|basis-|grow(?:-|$)|shrink(?:-|$)|order-)/u,
    property: 'flex',
  },
  {
    group: 'grid',
    pattern: /^(?:grid-|auto-cols-|auto-rows-|col-|row-|gap(?:-|$)|columns?-)/u,
    property: 'grid',
  },
  {
    group: 'alignment',
    pattern: /^(?:justify-|items-|content-|self-|place-)/u,
    property: 'alignment',
  },
  {
    group: 'spacing',
    pattern:
      /^(?:-?[mp][trblxyse]?-(?:.+)|space-[xy]-|divide-[xy]-|scroll-m|scroll-p)/u,
    property: 'spacing',
  },
  {
    group: 'sizing',
    pattern: /^(?:size-|w-|h-|min-w-|max-w-|min-h-|max-h-|aspect-)/u,
    property: 'sizing',
  },
  {
    group: 'typography',
    pattern:
      /^(?:font-|text-|leading-|tracking-|line-clamp-|list-|decoration-|underline|overline|line-through|no-underline|uppercase|lowercase|capitalize|normal-case|truncate|whitespace-|break-|hyphens-|content-)/u,
    property: 'typography',
  },
  {
    group: 'background',
    pattern: /^(?:bg-|from-|via-|to-|gradient-)/u,
    property: 'background',
  },
  {
    group: 'border',
    pattern: /^(?:border|rounded|ring|outline)/u,
    property: 'border',
  },
  {
    group: 'effects',
    pattern: /^(?:shadow|opacity-|mix-blend-|bg-blend-)/u,
    property: 'effects',
  },
  {
    group: 'filters',
    pattern:
      /^(?:filter|blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|saturate|sepia|backdrop-)/u,
    property: 'filters',
  },
  {
    group: 'transform',
    pattern:
      /^(?:transform|origin-|translate-|rotate-|skew-|scale-|perspective-)/u,
    property: 'transform',
  },
  {
    group: 'transition',
    pattern: /^(?:transition|duration-|ease-|delay-|will-change-)/u,
    property: 'transition',
  },
  {
    group: 'animation',
    pattern: /^(?:animate-)/u,
    property: 'animation',
  },
  {
    group: 'interactivity',
    pattern:
      /^(?:accent-|appearance-|caret-|cursor-|pointer-events-|resize|scroll-|snap-|touch-|select-)/u,
    property: 'interactivity',
  },
  {
    group: 'icons',
    pattern: /^(?:i-|icon-)/u,
    property: 'icon',
  },
  {
    group: 'svg',
    pattern: /^(?:fill-|stroke-)/u,
    property: 'svg',
  },
  {
    group: 'accessibility',
    pattern: /^(?:sr-only|not-sr-only)$/u,
    property: 'accessibility',
  },
]

/**
 * Built-in responsive variants ordered from smallest to largest
 */
export const RESPONSIVE_VARIANTS = ['sm', 'md', 'lg', 'xl', '2xl'] as const

export type TResponsiveVariant = (typeof RESPONSIVE_VARIANTS)[number]
