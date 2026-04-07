/** Basename for display in the renderer without importing Node `path`. */
export function basenameFromPath(filePath: string): string {
  const parts = filePath.split(/[/\\]/).filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : filePath
}
