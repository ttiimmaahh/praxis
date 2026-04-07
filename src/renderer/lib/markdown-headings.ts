export interface MarkdownHeading {
  level: number
  text: string
}

const ATX_HEADING = /^(#{1,6})\s+(.+?)\s*$/

export function extractMarkdownHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = []
  const lines = markdown.split(/\r?\n/)
  for (const line of lines) {
    const match = ATX_HEADING.exec(line.trimEnd())
    if (!match) continue
    const level = match[1].length
    const text = match[2].trim()
    if (text.length > 0) {
      headings.push({ level, text })
    }
  }
  return headings
}
