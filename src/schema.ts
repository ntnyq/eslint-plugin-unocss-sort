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

const sortTypeSchema = {
  enum: [
    'semantic',
    'uno',
    'natural',
    'alphabetical',
    'code-point',
    'custom',
    'unsorted',
  ],
} as const

/**
 * JSON schema for the UnoCSS ordering rule options
 */
export const orderOptionsSchema = {
  additionalProperties: false,
  properties: {
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
          type: sortTypeSchema,
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
              type: sortTypeSchema,
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
    partitionByNewLine: { type: 'boolean' },
    shortcuts: { enum: ['expanded', 'preserve-position', 'group'] },
    specialCharacters: { enum: ['keep', 'trim', 'remove'] },
    type: sortTypeSchema,
    unknown: { enum: ['preserve-position', 'group'] },
    unoAttributes: { items: regexOptionSchema, type: 'array' },
    unoFunctions: { items: { type: 'string' }, type: 'array' },
    unoVariables: { items: regexOptionSchema, type: 'array' },
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
  },
  type: 'object',
} as const
