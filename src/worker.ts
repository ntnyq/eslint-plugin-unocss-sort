import { stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import {
  isEmptyArray,
  isNonEmptyArray,
  isNonEmptyString,
  isNumber,
  isRecord,
  isString,
  unique,
} from '@ntnyq/utils'
import { loadConfig } from '@unocss/config'
import { createGenerator } from '@unocss/core'
import type { Shortcut, UnoGenerator } from '@unocss/core'
import { runAsWorker } from 'synckit'
import type { UtilityAnalysis } from './types'

interface GeneratorCacheEntry {
  fingerprint: string
  generator: UnoGenerator
  sources: string[]
}

const generatorCache = new Map<string, Promise<GeneratorCacheEntry>>()

process.env['ESLINT'] ||= 'true'

/**
 * Resolve the directory used to search for an UnoCSS configuration
 *
 * @param filename Physical or virtual source filename
 * @returns Directory used as the configuration search root
 */
function getSearchDirectory(filename: string): string {
  const virtualFileMatch = filename.match(/\.\w+\/[^/]+$/u)
  const physicalFilename = virtualFileMatch
    ? filename.slice(0, filename.lastIndexOf('/'))
    : filename

  return dirname(physicalFilename)
}

/**
 * Create a stable cache key for an UnoCSS generator
 *
 * @param configPath Explicit UnoCSS configuration path
 * @param filename Source filename used for automatic discovery
 * @returns Cache key scoped to the configuration source
 */
function getCacheKey(configPath: string | undefined, filename: string): string {
  return configPath
    ? `config:${resolve(process.cwd(), configPath)}`
    : `directory:${getSearchDirectory(filename)}`
}

/**
 * Create a fingerprint from configuration source metadata
 *
 * @param sources Configuration and dependency paths
 * @returns Fingerprint reflecting source modification states
 */
async function getFingerprint(sources: string[]): Promise<string> {
  const states = await Promise.all(
    sources.map(async source => {
      try {
        const state = await stat(source)
        return `${source}:${state.mtimeMs}:${state.size}`
      } catch {
        return `${source}:missing`
      }
    }),
  )

  return states.join('|')
}

/**
 * Load an UnoCSS configuration and create its cached generator entry
 *
 * @param configPath Explicit UnoCSS configuration path
 * @param filename Source filename used for automatic discovery
 * @returns Generator entry with its dependency fingerprint
 */
async function createGeneratorEntry(
  configPath: string | undefined,
  filename: string,
): Promise<GeneratorCacheEntry> {
  const searchDirectory = configPath
    ? process.cwd()
    : getSearchDirectory(filename)
  const loaded = await loadConfig(searchDirectory, configPath)

  if (isEmptyArray(loaded.sources)) {
    throw new Error(
      '[eslint-plugin-unocss-sort] No UnoCSS config file was found. Add uno.config.ts or configure settings.unocss.configPath.',
    )
  }

  const sources = [...loaded.sources, ...(loaded.dependencies ?? [])]
  const fingerprint = await getFingerprint(sources)
  const generator = await createGenerator({
    ...loaded.config,
    details: true,
    warn: false,
  })

  return { fingerprint, generator, sources }
}

/**
 * Get a cached UnoCSS generator and reload stale configurations
 *
 * @param configPath Explicit UnoCSS configuration path
 * @param filename Source filename used for automatic discovery
 * @returns UnoCSS generator for the resolved configuration
 */
async function getGenerator(
  configPath: string | undefined,
  filename: string,
): Promise<UnoGenerator> {
  const cacheKey = getCacheKey(configPath, filename)
  const cachedPromise = generatorCache.get(cacheKey)

  if (cachedPromise) {
    const cached = await cachedPromise
    const fingerprint = await getFingerprint(cached.sources)
    if (fingerprint === cached.fingerprint) {
      return cached.generator
    }
  }

  const nextPromise = createGeneratorEntry(configPath, filename)
  generatorCache.set(cacheKey, nextPromise)

  try {
    const next = await nextPromise
    return next.generator
  } catch (error) {
    generatorCache.delete(cacheKey)
    throw error
  }
}

/**
 * Extract generated CSS property names from a rule body
 *
 * @param body Generated CSS declaration body
 * @returns CSS property names found in the body
 */
function getProperties(body: string): string[] {
  return [
    ...body.matchAll(/(?:^|;)\s*(?<property>--?[\w-]+|[a-z][\w-]*)\s*:/giu),
  ]
    .map(match => match.groups?.['property'])
    .filter((property): property is string => isString(property))
}

/**
 * Check whether token parsing matched an UnoCSS shortcut
 *
 * @param shortcuts Shortcut matches returned by UnoCSS
 * @returns Whether at least one shortcut matched
 */
function hasMatchedShortcut(shortcuts: Shortcut[] | undefined): boolean {
  return isNonEmptyArray(shortcuts)
}

/**
 * Convert a breakpoint value into a comparable pixel value
 *
 * @param value Breakpoint value from the UnoCSS theme
 * @returns Numeric pixel value when supported
 */
function getBreakpointValue(value: unknown): number | undefined {
  if (!isString(value)) {
    return undefined
  }

  const matched = value.match(
    /^(?<value>-?\d+(?:\.\d+)?)(?<unit>px|r?em)?$/iu,
  )?.groups
  if (!isNonEmptyString(matched?.['value'])) {
    return undefined
  }

  const numericValue = Number(matched['value'])
  return matched['unit'] === 'em' || matched['unit'] === 'rem'
    ? numericValue * 16
    : numericValue
}

/**
 * Resolve responsive breakpoint names to numeric sort ranks
 *
 * @param generator Configured UnoCSS generator
 * @returns Breakpoint rank lookup ordered by resolved size
 */
function getBreakpoints(generator: UnoGenerator): Record<string, number> {
  const theme = generator.config.theme as Record<string, unknown>
  const rawBreakpoints = theme['breakpoints']
  if (!isRecord(rawBreakpoints)) {
    return {}
  }

  const entries = Object.entries(rawBreakpoints)
    .map(([name, value], sourceIndex) => ({
      name,
      rank: getBreakpointValue(value) ?? Number.MAX_SAFE_INTEGER + sourceIndex,
    }))
    .toSorted((left, right) => left.rank - right.rank)

  return Object.fromEntries(entries.map(({ name }, rank) => [name, rank]))
}

/**
 * Analyze utility tokens with the resolved UnoCSS generator
 *
 * @param configPath Explicit UnoCSS configuration path
 * @param tokens Utility tokens to analyze
 * @param filename Source filename used for configuration discovery
 * @returns Analysis metadata keyed by utility token
 */
export async function analyzeTokens(
  configPath: string | undefined,
  tokens: string[],
  filename: string,
): Promise<Record<string, UtilityAnalysis>> {
  const generator = await getGenerator(configPath, filename)
  const result: Record<string, UtilityAnalysis> = Object.create(null)
  const breakpoints = getBreakpoints(generator)

  await Promise.all(
    unique(tokens).map(async token => {
      const parsed = await generator.parseToken(token)
      if (!isNonEmptyArray(parsed)) {
        result[token] = {
          properties: [],
          recognized: false,
          shortcut: false,
        }
        return
      }

      const layer =
        parsed
          .map(item => item[4]?.layer ?? item[5]?.variantHandlers.at(-1)?.layer)
          .find(candidate => isString(candidate)) ?? 'default'
      const properties = unique(parsed.flatMap(item => getProperties(item[2])))
      const metaSortValues = parsed
        .map(item => item[4]?.sort)
        .filter((value): value is number => isNumber(value))

      result[token] = {
        breakpoints,
        layer,
        layerOrder: generator.config.layers[layer] ?? 0,
        properties,
        recognized: true,
        shortcut: parsed.some(item => hasMatchedShortcut(item[5]?.shortcuts)),
        unoOrder: Math.min(...parsed.map(item => item[0])),
        ...(isNonEmptyArray(metaSortValues) && {
          metaSort: Math.min(...metaSortValues),
        }),
      }
    }),
  )

  return result
}

runAsWorker(analyzeTokens)
