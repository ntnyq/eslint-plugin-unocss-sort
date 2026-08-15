import { createSyncFn } from 'synckit'
import type { analyzeTokens } from './worker'

/**
 * Worker source extension selected for source and built package execution
 */
const workerExtension = import.meta.url.endsWith('.ts') ? 'ts' : 'mjs'

/**
 * URL of the UnoCSS analysis worker matching the current module format
 */
const workerUrl = new URL(`worker.${workerExtension}`, import.meta.url)

/**
 * Synchronous bridge to the asynchronous UnoCSS analysis worker
 */
const analyzeTokensInWorker = createSyncFn<typeof analyzeTokens>(workerUrl, {
  timeout: 30_000,
})

/**
 * Analyze UnoCSS utility tokens through the synchronous worker bridge
 *
 * @param tokens Utility tokens to analyze
 * @param filename Source filename used for configuration discovery
 * @param configPath Explicit UnoCSS configuration path
 * @returns Analysis metadata keyed by utility token
 */
export function analyzeUnoTokens(
  tokens: string[],
  filename: string,
  configPath?: string,
): Awaited<ReturnType<typeof analyzeTokens>> {
  return analyzeTokensInWorker(configPath, tokens, filename)
}
