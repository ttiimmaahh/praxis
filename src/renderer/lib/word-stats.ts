const WORD_SPLIT = /\s+/

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (trimmed.length === 0) return 0
  return trimmed.split(WORD_SPLIT).filter(Boolean).length
}

/** Estimated minutes at ~200 words per minute. */
export function readingTimeMinutes(wordCount: number): number {
  if (wordCount <= 0) return 0
  return Math.max(1, Math.round(wordCount / 200))
}
