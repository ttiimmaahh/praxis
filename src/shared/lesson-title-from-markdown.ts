/**
 * Extracts the full YAML frontmatter block from Markdown content as a key-value map.
 * Returns null if no valid frontmatter delimiters are found.
 *
 * Uses simple line-based parsing (no YAML library dependency in shared code).
 * Handles bare values, quoted strings, and numeric values.
 */
export function parseFrontmatter(markdown: string): Record<string, unknown> | null {
  const text = markdown.replace(/^\uFEFF/, '')
  if (!text.startsWith('---')) return null
  const end = text.indexOf('\n---', 3)
  if (end === -1) return null

  const block = text.slice(3, end)
  const result: Record<string, unknown> = {}

  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (!match) continue
    const key = match[1]
    let raw = match[2].trim()
    if (raw.length === 0) {
      result[key] = ''
      continue
    }
    if (
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
    ) {
      raw = raw.slice(1, -1)
    }
    const asNum = Number(raw)
    result[key] = raw.length > 0 && !isNaN(asNum) && /^[\d.]+$/.test(raw) ? asNum : raw
  }

  return Object.keys(result).length > 0 ? result : null
}

/**
 * Derives a lesson sidebar label from Markdown content when `course.yaml` has no `title`.
 * Prefers the first ATX `#` heading (the visual title the user edits); falls back to
 * frontmatter `title:` if no heading is found.
 */
export function extractLessonDisplayTitle(markdown: string): string | undefined {
  const text = markdown.replace(/^\uFEFF/, '')
  let body = text
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3)
    if (end !== -1) {
      body = text.slice(end + 4).trimStart()
    }
  }

  for (const line of body.split(/\r?\n/)) {
    const heading = line.match(/^#\s+(.+?)\s*$/)
    if (heading) {
      const t = heading[1].trim()
      if (t.length > 0) return t
    }
  }

  // Fall back to frontmatter title if no heading found
  const fm = parseFrontmatter(markdown)
  if (fm && typeof fm.title === 'string' && fm.title.trim().length > 0) {
    return fm.title.trim()
  }

  return undefined
}
