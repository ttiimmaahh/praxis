/** Basename for display in the renderer without importing Node `path`. */
export function basenameFromPath(filePath: string): string {
  const parts = filePath.split(/[/\\]/).filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : filePath
}

/**
 * Sidebar label when `course.yaml` lists a lesson as a plain path string with no `title`.
 * Uses the file basename, strips `.md`/`.mdx`, replaces `-`/`_` with spaces, title-cases words.
 */
export function sidebarLabelFromLessonPath(relativePath: string): string {
  const base = basenameFromPath(relativePath)
  const withoutExt = base.replace(/\.(md|mdx)$/i, '')
  const spaced = withoutExt.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (spaced.length === 0) {
    return relativePath
  }
  return spaced.replace(/\b\w/g, (ch) => ch.toUpperCase())
}

/**
 * Join workspace root with path segments using the same separator as `rootPath` (cross-platform).
 * Drops `.` segments so results match Node `path.join` (e.g. `join(root, ".", "file.md")` → `root/file.md`),
 * which matters for course modules with `path: .` in `course.yaml`.
 */
export function joinWorkspacePath(rootPath: string, ...segments: string[]): string {
  const sep = rootPath.includes('\\') ? '\\' : '/'
  let result = rootPath.replace(/[/\\]+$/, '')
  for (const segment of segments) {
    const parts = segment.split(/[/\\]/).filter((p) => p.length > 0 && p !== '.')
    for (const part of parts) {
      result = result + sep + part
    }
  }
  return result
}

/** Normalize separators and trailing slashes for safe path comparison (cross-platform). */
export function normalizePathForCompare(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/\/+$/, '')
}

export function isPathInsideWorkspace(filePath: string, rootPath: string): boolean {
  const root = normalizePathForCompare(rootPath).toLowerCase()
  const file = normalizePathForCompare(filePath).toLowerCase()
  if (file === root) {
    return true
  }
  const prefix = root.endsWith('/') ? root : `${root}/`
  return file.startsWith(prefix)
}

/** True when `filePath` is the workspace root `course.yaml`. */
export function isCourseYamlAtWorkspaceRoot(filePath: string, rootPath: string | null): boolean {
  if (!rootPath) {
    return false
  }
  const expected = normalizePathForCompare(joinWorkspacePath(rootPath, 'course.yaml')).toLowerCase()
  const actual = normalizePathForCompare(filePath).toLowerCase()
  return actual === expected
}
