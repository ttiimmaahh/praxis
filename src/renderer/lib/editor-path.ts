/** Paths that should use the YAML/CodeMirror editor instead of Milkdown. */
export function isYamlFilePath(filePath: string): boolean {
  const base = filePath.split(/[/\\]/).pop()?.toLowerCase() ?? ''
  return base.endsWith('.yaml') || base.endsWith('.yml')
}
