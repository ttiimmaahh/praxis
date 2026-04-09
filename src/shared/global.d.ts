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
}
