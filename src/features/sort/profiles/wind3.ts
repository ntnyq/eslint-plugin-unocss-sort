import type { SemanticProfileDefinition } from './types'

/**
 * Semantic ordering behavior preserved from the v0.1 default
 */
export const WIND3_V1_PROFILE = {
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
  groups: [
    'layout',
    'position',
    'display',
    'table',
    ['flex', 'grid', 'alignment'],
    'spacing',
    'sizing',
    'typography',
    ['background', 'mask'],
    ['border', 'divide'],
    ['effects', 'filters'],
    ['transform', 'transition', 'animation'],
    ['ui-behavior', 'interactivity'],
    'icons',
    ['svg', 'accessibility'],
    'arbitrary-property',
    'shortcut',
    'known',
    'unknown',
  ],
  name: 'wind3',
  orderVersion: 1,
  patterns: [
    {
      group: 'layout',
      pattern:
        /^(?:container|box-|box$|columns?-|break-(?:after|before|inside)-|object-|overflow|overscroll|visible$|invisible$|collapse$|isolate(?:-|$)|isolation-|float-|clear-|contain-|content-visibility-|intrinsic-|backface-)/u,
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
        /^(?:hidden$|block$|inline(?:-block|-flex|-grid)?$|flow-root$|contents$|list-item$|display-|flex$|grid$)/u,
      property: 'display',
    },
    {
      group: 'table',
      pattern:
        /^(?:inline-table$|table(?:-|$)|border-(?:collapse|separate)$|border-spacing-|caption-(?:top|bottom)$)/u,
      property: 'table',
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
        /^(?:-?[mp](?:[trblxyse]|[bi][se])?-(?:.+)|[mp](?:[trblxyse]|[bi][se])?\d|space-(?:[xy]|block|inline)(?:-|$)|scroll-m|scroll-p)/u,
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
        /^(?:font-|text-|c-|color-(?!scheme(?:-|$))|fw-|lh-|leading-|line-height-|tracking-|line-clamp-|list-|decoration-|underline|overline|line-through|no-underline|uppercase|lowercase|capitalize|normal-case|truncate|whitespace-|break-(?:normal|words|all|keep|anywhere)$|hyphens-|content-|placeholder-|case-|(?:not-)?(?:italic|oblique)$|(?:subpixel-)?antialiased$|write-|ordinal$|slashed-zero$|(?:normal|lining|oldstyle|proportional|tabular)-nums$|(?:diagonal|stacked)-fractions$)/u,
      property: 'typography',
    },
    {
      group: 'background',
      pattern: /^(?:bg-|from-|via-|to-|gradient-)/u,
      property: 'background',
    },
    {
      group: 'mask',
      pattern: /^mask(?:-|$)/u,
      property: 'mask',
    },
    {
      group: 'border',
      pattern: /^(?:border|rounded|ring|outline)/u,
      property: 'border',
    },
    {
      group: 'divide',
      pattern: /^divide(?:-|$)/u,
      property: 'divide',
    },
    {
      group: 'effects',
      pattern: /^(?:shadow|opacity-|mix-blend-|bg-blend-|image-render-)/u,
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
      group: 'ui-behavior',
      pattern:
        /^(?:accent-|appearance-|caret-|(?:color-)?scheme-|field-sizing-)/u,
      property: 'ui-behavior',
    },
    {
      group: 'interactivity',
      pattern:
        /^(?:cursor-|pointer-events-|resize|scroll-|snap-|touch-|select-)/u,
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
  ],
  propertyGroupOverrides: new Map([
    ['divide', 'border'],
    ['table', 'display'],
  ]),
  propertyGroups: [
    [
      /^(?:visibility|overflow(?:-[xy])?$|object-|columns?$|float$|clear$|contain$|contain-intrinsic-|content-visibility$|backface-visibility$|break-(?:after|before|inside)$)/u,
      'layout',
    ],
    [
      /^(?:--un-border-spacing-|border-collapse$|border-spacing$|caption-side$|empty-cells$|table-layout$)/u,
      'table',
    ],
    [/^(?:position|inset|top|right|bottom|left|z-index)/u, 'position'],
    [/^display$/u, 'display'],
    [/^(?:flex|order$)/u, 'flex'],
    [/^(?:grid|grid-|column-|row-)/u, 'grid'],
    [/^(?:align-|justify-|place-)/u, 'alignment'],
    [/^(?:margin|padding|gap|scroll-margin|scroll-padding)/u, 'spacing'],
    [
      /^(?:width|height|inline-size|block-size|min-|max-|aspect-ratio)/u,
      'sizing',
    ],
    [
      /^(?:font|line-height|letter-spacing|text-|color$|white-space|word-|overflow-wrap$|hyphens|content$|list-style|writing-mode$|text-orientation$|-(?:webkit|moz)-font-smoothing$)/u,
      'typography',
    ],
    [/^background/u, 'background'],
    [/^(?:--un-mask-|(?:-webkit-)?mask(?:-|$))/u, 'mask'],
    [/^--un-divide-/u, 'divide'],
    [/^(?:border|outline|box-decoration)/u, 'border'],
    [
      /^(?:box-shadow|opacity|mix-blend|background-blend|image-rendering$)/u,
      'effects',
    ],
    [/^(?:filter|backdrop-filter)/u, 'filters'],
    [/^(?:transform|translate|rotate|scale|perspective)/u, 'transform'],
    [/^(?:transition|view-transition)/u, 'transition'],
    [/^animation/u, 'animation'],
    [
      /^(?:--un-(?:accent|caret)-|(?:-webkit-)?appearance$|accent-color$|caret-color$|color-scheme$|field-sizing$)/u,
      'ui-behavior',
    ],
    [
      /^(?:cursor|pointer-events|resize|scroll-|touch-action|user-select)/u,
      'interactivity',
    ],
    [/^(?:fill|stroke)/u, 'svg'],
  ],
  responsiveVariants: ['sm', 'md', 'lg', 'xl', '2xl'],
  variantCustomGroups: [
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
  variantGroups: [
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
  ],
} satisfies SemanticProfileDefinition
