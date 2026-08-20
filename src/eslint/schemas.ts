/**
 * JSON schema for string and descriptor regular-expression options
 */
const regexOptionSchema = {
  anyOf: [
    { type: 'string' },
    {
      additionalProperties: false,
      properties: {
        flags: { type: 'string' },
        pattern: { type: 'string' },
      },
      required: ['pattern'],
      type: 'object',
    },
  ],
} as const

/**
 * JSON schema for secondary sorting configuration
 */
const fallbackSortSchema = {
  additionalProperties: false,
  properties: {
    order: { enum: ['asc', 'desc'] },
    type: {
      enum: ['natural', 'alphabetical', 'code-point', 'custom', 'unsorted'],
    },
  },
  required: ['type'],
  type: 'object',
} as const

/**
 * JSON schema for supported primary sorting strategies
 */
const sortTypeSchema = {
  enum: [
    'semantic',
    'uno',
    'uno-metadata',
    'natural',
    'alphabetical',
    'code-point',
    'custom',
    'unsorted',
  ],
} as const

/**
 * JSON schema for group-local sorting strategies
 */
const groupSortTypeSchema = {
  enum: [
    'semantic',
    'uno-metadata',
    'natural',
    'alphabetical',
    'code-point',
    'custom',
    'unsorted',
  ],
} as const

/**
 * JSON schema for string and object target matchers
 */
const targetMatcherSchema = {
  anyOf: [
    { const: 'strings' },
    {
      additionalProperties: false,
      properties: {
        path: regexOptionSchema,
        type: { enum: ['object-keys', 'object-values'] },
      },
      required: ['type'],
      type: 'object',
    },
  ],
} as const

/**
 * JSON schema properties shared by every target selector
 */
const targetProperties = {
  match: { items: targetMatcherSchema, type: 'array' },
  name: regexOptionSchema,
} as const

/**
 * JSON schema for attribute, callee, tag, and variable selectors
 */
const targetSelectorSchema = {
  anyOf: [
    {
      additionalProperties: false,
      properties: {
        ...targetProperties,
        kind: { const: 'attribute' },
      },
      required: ['kind', 'name'],
      type: 'object',
    },
    {
      additionalProperties: false,
      properties: {
        ...targetProperties,
        arguments: {
          anyOf: [{ enum: ['all', 'first', 'last'] }, { type: 'integer' }],
        },
        kind: { const: 'callee' },
      },
      required: ['kind', 'name'],
      type: 'object',
    },
    {
      additionalProperties: false,
      properties: {
        ...targetProperties,
        kind: { const: 'tag' },
      },
      required: ['kind', 'name'],
      type: 'object',
    },
    {
      additionalProperties: false,
      properties: {
        ...targetProperties,
        kind: { const: 'variable' },
      },
      required: ['kind', 'name'],
      type: 'object',
    },
  ],
} as const

/**
 * JSON schema for the UnoCSS ordering rule options
 */
export const orderOptionsSchema = {
  additionalProperties: false,
  properties: {
    analysis: { enum: ['auto', 'always', 'never'] },
    alphabet: { type: 'string' },
    customGroups: {
      items: {
        additionalProperties: true,
        properties: {
          anyOf: {
            items: { additionalProperties: true, type: 'object' },
            type: 'array',
          },
          fallbackSort: fallbackSortSchema,
          groupName: { type: 'string' },
          order: { enum: ['asc', 'desc'] },
          type: groupSortTypeSchema,
        },
        required: ['groupName'],
        type: 'object',
      },
      type: 'array',
    },
    fallbackSort: fallbackSortSchema,
    groups: {
      items: {
        anyOf: [
          { type: 'string' },
          { items: { type: 'string' }, type: 'array' },
          {
            additionalProperties: false,
            properties: {
              fallbackSort: fallbackSortSchema,
              group: {
                anyOf: [
                  { type: 'string' },
                  { items: { type: 'string' }, type: 'array' },
                ],
              },
              order: { enum: ['asc', 'desc'] },
              type: groupSortTypeSchema,
            },
            required: ['group'],
            type: 'object',
          },
        ],
      },
      type: 'array',
    },
    ignoreCase: { type: 'boolean' },
    locales: {
      anyOf: [{ type: 'string' }, { items: { type: 'string' }, type: 'array' }],
    },
    order: { enum: ['asc', 'desc'] },
    orderVersion: { enum: [1] },
    partitionByNewLine: { type: 'boolean' },
    profile: { enum: ['wind3'] },
    shortcuts: { enum: ['expanded', 'preserve-position', 'group'] },
    specialCharacters: { enum: ['keep', 'trim', 'remove'] },
    targets: { items: targetSelectorSchema, type: 'array' },
    type: sortTypeSchema,
    unknown: { enum: ['preserve-position', 'group'] },
    variants: {
      additionalProperties: false,
      properties: {
        compoundOrder: { enum: ['outer-first', 'inner-first'] },
        customGroups: {
          items: {
            additionalProperties: false,
            properties: {
              groupName: { type: 'string' },
              variantNamePattern: regexOptionSchema,
            },
            required: ['groupName', 'variantNamePattern'],
            type: 'object',
          },
          type: 'array',
        },
        groups: {
          items: {
            anyOf: [
              { type: 'string' },
              { items: { type: 'string' }, type: 'array' },
            ],
          },
          type: 'array',
        },
        placement: { enum: ['grouped', 'attached'] },
        responsiveOrder: { enum: ['theme', 'source', 'natural'] },
      },
      type: 'object',
    },
    whitespace: { enum: ['preserve', 'collapse'] },
  },
  type: 'object',
} as const

/**
 * JSON schema for the duplicate-class rule options
 */
export const noDuplicateClassesOptionsSchema = {
  additionalProperties: false,
  properties: {
    targets: { items: targetSelectorSchema, type: 'array' },
  },
  type: 'object',
} as const
