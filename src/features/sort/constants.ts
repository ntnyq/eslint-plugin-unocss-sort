import type { SortOptions } from './types'

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
      /^(?:container|box-|box$|columns?-|break-(?:after|before|inside)-|object-|overflow|overscroll|visible$|invisible$|collapse$|isolate(?:-|$)|isolation-|float-|clear-|contain-|content-visibility-|intrinsic-)/u,
    property: 'layout',
  },
  {
    group: 'position',
    pattern:
      /^(?:(?:static|fixed|absolute|relative|sticky)$|(?:position|pos)-|inset|top-|right-|bottom-|left-|start-|end-|z(?:-|(?=\d)))/u,
    property: 'position',
  },
  {
    group: 'display',
    pattern:
      /^(?:hidden$|block$|inline(?:-block|-flex|-grid|-table)?$|flow-root$|contents$|list-item$|table(?:-.+)?$|display-|flex$|grid$)/u,
    property: 'display',
  },
  {
    group: 'flex',
    pattern: /^(?:flex-|basis-|grow(?:-|$)|shrink(?:-|$)|order-)/u,
    property: 'flex',
  },
  {
    group: 'grid',
    pattern: /^(?:grid-|auto-cols-|auto-rows-|col-|row-|gap(?:-|$))/u,
    property: 'grid',
  },
  {
    group: 'alignment',
    pattern:
      /^(?:justify-|items-|self-|place-|(?:vertical|align|v)-|content-(?:(?:center|end)-safe|center|start|end|between|around|evenly|baseline|stretch|normal|inherit|initial|revert(?:-layer)?|unset)$)/u,
    property: 'alignment',
  },
  {
    group: 'spacing',
    pattern:
      /^(?:-?[mp](?:[trblxyse]|[bi][se])?-(?:.+)|[mp](?:[trblxyse]|[bi][se])?\d|space-(?:[xy]|block|inline)(?:-|$)|divide(?:$|-?[xy](?:-|$)|-(?:block|inline)(?:-|$))|scroll-m|scroll-p)/u,
    property: 'spacing',
  },
  {
    group: 'sizing',
    pattern:
      /^(?:size-|(?:min-|max-)?(?:w|h|block|inline)-|(?:min-|max-)?[wh]\d|aspect-)/u,
    property: 'sizing',
  },
  {
    group: 'typography',
    pattern:
      /^(?:font-|text-|c-|color-|fw-|lh-|leading-|line-height-|tracking-|line-clamp-|list-|decoration-|underline|overline|line-through|no-underline|uppercase|lowercase|capitalize|normal-case|truncate|whitespace-|break-(?:normal|words|all|keep|anywhere)$|hyphens-|content-|placeholder-)/u,
    property: 'typography',
  },
  {
    group: 'background',
    pattern: /^(?:bg-|from-|via-|to-|gradient-)/u,
    property: 'background',
  },
  {
    group: 'border',
    pattern: /^(?:border|rounded|ring|outline|divide(?:-|$))/u,
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
      /^(?:transform|origin-|translate-|rotate-|skew-|scale-|perspect(?:ive)?-)/u,
    property: 'transform',
  },
  {
    group: 'transition',
    pattern:
      /^(?:transition|duration-|ease-|delay-|will-change-|view-transition-)/u,
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
      /^(?:accent-|appearance-|caret-|cursor-|pointer-events-|resize|scroll-|snap-|touch-|select-|field-sizing-)/u,
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

/**
 * Built-in responsive variant name
 */
export type ResponsiveVariant = (typeof RESPONSIVE_VARIANTS)[number]
