import type { CourseLoadStatus } from '@/stores/course-store'
import {
  basenameFromPath,
  isCourseYamlAtWorkspaceRoot,
  isPathInsideWorkspace
} from '@/lib/path-utils'

/**
 * After a successful save, whether to reload the course manifest so the sidebar stays in sync.
 * Always reload when `course.yaml` changes; when a course is active, also reload for Markdown
 * lesson edits (titles come from file content).
 */
export function shouldReloadCourseManifestAfterSave(
  filePath: string,
  rootPath: string | null,
  courseStatus: CourseLoadStatus
): boolean {
  if (!rootPath || !isPathInsideWorkspace(filePath, rootPath)) {
    return false
  }
  if (isCourseYamlAtWorkspaceRoot(filePath, rootPath)) {
    return true
  }
  if (courseStatus !== 'ready') {
    return false
  }
  const base = basenameFromPath(filePath)
  return /\.(md|mdx)$/i.test(base)
}
