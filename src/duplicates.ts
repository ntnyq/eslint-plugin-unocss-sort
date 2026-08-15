export interface DuplicateClassResult {
  duplicates: string[]
  output: string
}

/**
 * Remove exact duplicate tokens while preserving surrounding source layout
 *
 * @param input Static class-list segment
 * @returns Deduplicated output and duplicate token names
 */
export function removeDuplicateClasses(input: string): DuplicateClassResult {
  const duplicates = new Set<string>()
  const seen = new Set<string>()
  const matches = [...input.matchAll(/\S+/gu)]

  let output = ''
  let sourceIndex = 0

  for (const match of matches) {
    const [token] = match
    const tokenIndex = match.index
    if (seen.has(token)) {
      duplicates.add(token)
    } else {
      seen.add(token)
      output += input.slice(sourceIndex, tokenIndex) + token
    }
    sourceIndex = tokenIndex + token.length
  }

  output += input.slice(sourceIndex)

  return {
    duplicates: [...duplicates],
    output,
  }
}
