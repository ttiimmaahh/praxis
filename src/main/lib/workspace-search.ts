import { readdir, readFile } from 'fs/promises'
import { extname, join } from 'path'

export interface WorkspaceSearchMatch {
  filePath: string
  line: number
  lineText: string
}

const MAX_RESULTS = 300

async function collectMarkdownFiles(directoryPath: string, out: string[]): Promise<void> {
  const entries = await readdir(directoryPath, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = join(directoryPath, entry.name)
    if (entry.isDirectory()) {
      await collectMarkdownFiles(fullPath, out)
    } else if (extname(entry.name).toLowerCase() === '.md') {
      out.push(fullPath)
    }
  }
}

export async function searchWorkspaceMarkdown(
  rootPath: string,
  query: string
): Promise<WorkspaceSearchMatch[]> {
  const trimmed = query.trim()
  if (trimmed.length === 0) return []

  const needle = trimmed.toLowerCase()
  const mdFiles: string[] = []
  await collectMarkdownFiles(rootPath, mdFiles)

  const matches: WorkspaceSearchMatch[] = []

  for (const filePath of mdFiles) {
    if (matches.length >= MAX_RESULTS) break
    let content: string
    try {
      content = await readFile(filePath, 'utf-8')
    } catch (e) {
      console.debug(`Skipping unreadable file during search: ${filePath}`, e)
      continue
    }
    const lines = content.split(/\r?\n/)
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      if (matches.length >= MAX_RESULTS) break
      const lineText = lines[lineIndex]
      if (lineText.toLowerCase().includes(needle)) {
        matches.push({
          filePath,
          line: lineIndex + 1,
          lineText
        })
      }
    }
  }

  return matches
}
