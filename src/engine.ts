import { createSyncFn } from 'synckit'
import type { analyzeTokens } from './worker'

const workerExtension = import.meta.url.endsWith('.ts') ? 'ts' : 'mjs'
const workerUrl = new URL(`worker.${workerExtension}`, import.meta.url)

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
