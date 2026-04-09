// Ambient global types shared by the main, preload, and renderer processes.
//
// This file must remain a script (no top-level `import`/`export`) so its
// declarations land in the global namespace. It is picked up by both
// `tsconfig.node.json` and `tsconfig.web.json` via their `src/shared/**/*`
// include globs.
//
// Keep renderer-only augmentations (e.g. `interface Window`) in
// `src/renderer/env.d.ts` — they require DOM lib types that are only
// available to the renderer tsconfig.

interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  extension: string
}

interface FileSystemChangeEvent {
  type: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir'
  path: string
}

interface WorkspaceSearchMatch {
  filePath: string
  line: number
  lineText: string
}

interface CourseProgress {
  completedLessons: string[]
}

interface UpdateEventInfo {
  version: string
  releaseNotes?: string
}

interface UpdateErrorInfo {
  message: string
}

type ThemeMode = 'light' | 'dark' | 'system'
type EditorFontPreset = 'system' | 'serif' | 'mono'
type ExportTheme = 'light' | 'dark'
type ExportPageSize = 'letter' | 'a4'
type ExportOrientation = 'portrait' | 'landscape'

interface DocumentExportPayload {
  bodyHtml: string
  sourceFilePath: string
  documentTitle: string
  theme: ExportTheme
}

interface DocumentPdfExportPayload extends DocumentExportPayload {
  pageSize: ExportPageSize
  orientation: ExportOrientation
}

interface LessonExportEntry {
  moduleSlug: string
  moduleTitle: string
  lessonSlug: string
  lessonTitle: string
  lessonFilePath: string
  bodyHtml: string
}

interface CourseExportPayload {
  courseTitle: string
  lessons: LessonExportEntry[]
  theme: ExportTheme
}

interface CoursePdfExportPayload extends CourseExportPayload {
  pageSize: ExportPageSize
  orientation: ExportOrientation
}

interface SessionData {
  rootPath: string | null
  openFiles: Array<{ filePath: string; fileName: string }>
  activeFilePath: string | null
  sidebarWidth: number
  themeMode?: ThemeMode
  editorFontPreset?: EditorFontPreset
  editorFontSizePx?: number
  editorLineHeight?: number
  courseProjectFilesExpanded?: boolean
  reopenLastFolder?: boolean
  templatesDir?: string
  exportTheme?: ExportTheme
  exportPageSize?: ExportPageSize
  exportOrientation?: ExportOrientation
}
