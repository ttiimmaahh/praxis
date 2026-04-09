/**
 * Renderer-side orchestration for export. Stitches together:
 *   1. Reading the active markdown (live edits for single-doc, disk for course)
 *   2. Rendering markdown → HTML via the shared headless Plate pipeline
 *   3. Dispatching to the main-process export IPC with the user's prefs
 *   4. Surfacing toasts for progress / success / error
 *
 * Kept deliberately thin — all file I/O, dialogs, and PDF rendering live in main.
 */

import { toast } from 'sonner'

import { useWorkspaceStore } from '@/stores/workspace-store'
import { useCourseStore } from '@/stores/course-store'
import { useExportStore } from '@/stores/export-store'
import { useLearnerStore } from '@/stores/learner-store'
import { joinWorkspacePath } from '@/lib/path-utils'
import { renderMarkdownToHtml } from './render-markdown-to-html'

export type ExportFormat = 'html' | 'pdf'

/**
 * Resolves the current "active document" across both editor and learner modes.
 *
 * In editor mode the active document is `workspace-store.activeTabPath`.
 * In learner mode there are no tabs — the visible document is the lesson at
 * `learner-store.currentIndex`, whose absolute path we build from the course
 * root + the lesson's module/lesson relative paths.
 *
 * Returning the live editor markdown when available lets single-doc export
 * honor in-flight edits; learner mode always falls back to disk because the
 * learner view is read-only anyway.
 */
function resolveActiveDocumentTarget(): {
  filePath: string
  title: string
} | null {
  const learner = useLearnerStore.getState()
  if (learner.active) {
    const current = learner.flatLessons[learner.currentIndex]
    const { rootPath } = useWorkspaceStore.getState()
    if (!current || !rootPath) return null
    const filePath = joinWorkspacePath(rootPath, current.modulePath, current.lessonPath)
    return { filePath, title: current.lessonTitle }
  }

  const { activeTabPath, openTabs } = useWorkspaceStore.getState()
  if (!activeTabPath) return null
  const activeTab = openTabs.find((t) => t.filePath === activeTabPath)
  const title = titleFromFileName(activeTab?.fileName ?? fileName(activeTabPath))
  return { filePath: activeTabPath, title }
}

/* ─────────────────── single-document orchestrator ────────────────── */

export async function exportActiveDocumentAs(format: ExportFormat): Promise<void> {
  const target = resolveActiveDocumentTarget()
  if (!target) {
    toast.error('No document open to export')
    return
  }

  const { filePath, title: documentTitle } = target
  const { liveMarkdownByPath } = useWorkspaceStore.getState()

  // Prefer the live (possibly-dirty) markdown from the editor; fall back to disk.
  // Learner mode won't have a liveMarkdownByPath entry, so it falls straight through.
  let markdown = liveMarkdownByPath[filePath]
  if (markdown === undefined) {
    try {
      markdown = await window.electronAPI.readFile(filePath)
    } catch (err) {
      toast.error('Could not read file for export', { description: errorMessage(err) })
      return
    }
  }

  let bodyHtml: string
  try {
    bodyHtml = await renderMarkdownToHtml(markdown)
  } catch (err) {
    toast.error('Export rendering failed', { description: errorMessage(err) })
    return
  }

  const prefs = useExportStore.getState()

  try {
    let writtenPath: string | null
    if (format === 'html') {
      writtenPath = await window.electronAPI.exportDocumentHtml({
        bodyHtml,
        sourceFilePath: filePath,
        documentTitle,
        theme: prefs.exportTheme
      })
    } else {
      writtenPath = await window.electronAPI.exportDocumentPdf({
        bodyHtml,
        sourceFilePath: filePath,
        documentTitle,
        theme: prefs.exportTheme,
        pageSize: prefs.exportPageSize,
        orientation: prefs.exportOrientation
      })
    }

    if (!writtenPath) return // user cancelled save dialog — silent no-op
    toast.success(`Exported as ${format.toUpperCase()}`, {
      description: writtenPath
    })
  } catch (err) {
    toast.error(`Export to ${format.toUpperCase()} failed`, {
      description: errorMessage(err)
    })
  }
}

/* ───────────────────── course orchestrator ───────────────────────── */

const COURSE_EXPORT_TOAST_ID = 'course-export'

export async function exportActiveCourseAs(format: ExportFormat): Promise<void> {
  const { manifest, status } = useCourseStore.getState()
  const { rootPath } = useWorkspaceStore.getState()

  if (status !== 'ready' || !manifest || !rootPath) {
    toast.error('No course loaded to export')
    return
  }

  // Auto-save any dirty files in this workspace so we can read lesson markdown
  // straight from disk below. Uses live editor content.
  try {
    await autoSaveDirtyFiles(rootPath)
  } catch (err) {
    toast.error('Could not save unsaved changes', { description: errorMessage(err) })
    return
  }

  const lessonEntries = collectLessonEntries(manifest, rootPath)
  const total = lessonEntries.length

  toast.loading('Exporting course…', {
    id: COURSE_EXPORT_TOAST_ID,
    description: `Preparing ${total} lesson${total === 1 ? '' : 's'}`
  })

  // Read lesson markdown + render HTML, one at a time so the toast updates
  // deterministically and we don't drown the main thread in parallel renders.
  const rendered: LessonExportEntry[] = []
  try {
    for (let i = 0; i < lessonEntries.length; i++) {
      const entry = lessonEntries[i]
      const markdown = await window.electronAPI.readFile(entry.lessonFilePath)
      const bodyHtml = await renderMarkdownToHtml(markdown)
      rendered.push({ ...entry, bodyHtml })
      toast.loading('Exporting course…', {
        id: COURSE_EXPORT_TOAST_ID,
        description: `Rendered ${i + 1} of ${total} lessons`
      })
    }
  } catch (err) {
    toast.dismiss(COURSE_EXPORT_TOAST_ID)
    toast.error('Course export failed while rendering lessons', {
      description: errorMessage(err)
    })
    return
  }

  const prefs = useExportStore.getState()
  const courseTitle = manifest.title

  try {
    let writtenPath: string | null
    if (format === 'html') {
      writtenPath = await window.electronAPI.exportCourseHtml({
        courseTitle,
        lessons: rendered,
        theme: prefs.exportTheme
      })
    } else {
      writtenPath = await window.electronAPI.exportCoursePdf({
        courseTitle,
        lessons: rendered,
        theme: prefs.exportTheme,
        pageSize: prefs.exportPageSize,
        orientation: prefs.exportOrientation
      })
    }

    toast.dismiss(COURSE_EXPORT_TOAST_ID)

    if (!writtenPath) return // user cancelled save dialog
    toast.success(
      format === 'html' ? 'Course exported as HTML bundle' : 'Course exported as PDF',
      { description: writtenPath }
    )
  } catch (err) {
    toast.dismiss(COURSE_EXPORT_TOAST_ID)
    toast.error(`Course export to ${format.toUpperCase()} failed`, {
      description: errorMessage(err)
    })
  }
}

/* ────────────────────────── helpers ──────────────────────────────── */

/**
 * Persist live-editor markdown for any dirty tabs under the current workspace
 * root before a course export walk. Uses liveMarkdownByPath as the source of
 * truth — the content the user is actively editing.
 */
async function autoSaveDirtyFiles(rootPath: string): Promise<void> {
  const { openTabs, liveMarkdownByPath, markDirty } = useWorkspaceStore.getState()
  const dirtyInWorkspace = openTabs.filter(
    (tab) => tab.isDirty && isUnderRoot(tab.filePath, rootPath)
  )
  if (dirtyInWorkspace.length === 0) return

  for (const tab of dirtyInWorkspace) {
    const content = liveMarkdownByPath[tab.filePath]
    if (content === undefined) continue
    await window.electronAPI.writeFile(tab.filePath, content)
    markDirty(tab.filePath, false)
  }

  toast.success(
    `Saved ${dirtyInWorkspace.length} unsaved file${dirtyInWorkspace.length === 1 ? '' : 's'} before exporting`
  )
}

interface LessonEntryBase {
  moduleSlug: string
  moduleTitle: string
  lessonSlug: string
  lessonTitle: string
  lessonFilePath: string
}

function collectLessonEntries(
  manifest: NonNullable<ReturnType<typeof useCourseStore.getState>['manifest']>,
  rootPath: string
): LessonEntryBase[] {
  const entries: LessonEntryBase[] = []
  for (const mod of manifest.modules) {
    const moduleTitle = mod.title ?? humanize(mod.path)
    const moduleSlug = slugify(mod.path)
    for (const lesson of mod.lessons) {
      const lessonRelPath = lesson.path
      const lessonTitle = lesson.title ?? humanize(stripMdExt(lessonRelPath))
      const lessonSlug = slugify(stripMdExt(lessonRelPath))
      const lessonFilePath = joinPath(rootPath, mod.path, lessonRelPath)
      entries.push({
        moduleSlug,
        moduleTitle,
        lessonSlug,
        lessonTitle,
        lessonFilePath
      })
    }
  }
  return entries
}

function isUnderRoot(filePath: string, rootPath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/')
  const root = rootPath.replace(/\\/g, '/')
  return normalized === root || normalized.startsWith(root + '/')
}

function joinPath(...segments: string[]): string {
  // Preserve absolute leading segment; join the rest with platform-agnostic `/`.
  return segments
    .map((s, i) => (i === 0 ? s.replace(/[/\\]+$/, '') : s.replace(/^[/\\]+|[/\\]+$/g, '')))
    .filter(Boolean)
    .join('/')
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.md$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'item'
}

function humanize(value: string): string {
  const base = value.replace(/\.md$/i, '').replace(/^[0-9]+[-_. ]*/, '')
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    || value
}

function stripMdExt(value: string): string {
  return value.replace(/\.md$/i, '')
}

function fileName(filePath: string): string {
  const idx = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  return idx >= 0 ? filePath.slice(idx + 1) : filePath
}

function titleFromFileName(name: string): string {
  return humanize(name)
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}
