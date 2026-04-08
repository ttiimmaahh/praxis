/**
 * Derives a lesson sidebar label from Markdown content when `course.yaml` has no `title`.
 * Prefers YAML frontmatter `title:`; otherwise the first ATX `#` heading.
 */
export function extractLessonDisplayTitle(markdown: string): string | undefined {
  const text = markdown.replace(/^\uFEFF/, '')
  let body = text

  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3)
    if (end !== -1) {
      const frontmatterBlock = text.slice(3, end)
      const fromFm = parseTitleFromFrontmatter(frontmatterBlock)
      if (fromFm) {
        return fromFm
      }
      body = text.slice(end + 4).trimStart()
    }
  }

  for (const line of body.split(/\r?\n/)) {
    const heading = line.match(/^#\s+(.+?)\s*$/)
    if (heading) {
      const t = heading[1].trim()
      return t.length > 0 ? t : undefined
    }
  }

  return undefined
}

function parseTitleFromFrontmatter(block: string): string | undefined {
  const match = block.match(/^title:\s*(.+)$/m)
  if (!match) {
    return undefined
  }
  let raw = match[1].trim()
  if (raw.length === 0) {
    return undefined
  }
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1)
  }
  return raw.length > 0 ? raw : undefined
}
