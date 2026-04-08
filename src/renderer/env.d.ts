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

type CourseLessonRef = {
  path: string
  title?: string
}

type CourseModuleManifest = {
  path: string
  title?: string
  lessons: CourseLessonRef[]
}

type CourseManifestParsed = {
  title: string
  modules: CourseModuleManifest[]
}

type LoadCourseManifestResult =
  | { status: 'no-manifest' }
  | { status: 'invalid'; errors: string[] }
  | { status: 'ok'; manifest: CourseManifestParsed; warnings: string[] }

type CourseAuthoringResult = { ok: true } | { ok: false; error: string }

type CreateNewCourseFolderResult =
  | null
  | { ok: true; folderPath: string }
  | { ok: false; error: string }

interface CourseProgress {
  completedLessons: string[]
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
}

interface ElectronAPI {
  platform: 'darwin' | 'win32' | 'linux'
  openFolder: () => Promise<string | null>
  readDirectory: (directoryPath: string) => Promise<FileEntry[]>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<void>
  createFile: (parentPath: string, fileName: string) => Promise<string>
  createDirectory: (parentPath: string, dirName: string) => Promise<string>
  rename: (oldPath: string, newName: string) => Promise<string>
  delete: (entryPath: string) => Promise<void>
  searchWorkspace: (rootPath: string, query: string) => Promise<WorkspaceSearchMatch[]>
  loadCourseManifest: (rootPath: string) => Promise<LoadCourseManifestResult>
  createNewCourseFolder: () => Promise<CreateNewCourseFolderResult>
  scaffoldCourseInWorkspace: (courseRoot: string) => Promise<CourseAuthoringResult>
  addCourseModule: (courseRoot: string) => Promise<CourseAuthoringResult>
  addCourseLesson: (courseRoot: string, modulePath: string) => Promise<CourseAuthoringResult>
  getCourseProgress: (courseRoot: string) => Promise<CourseProgress>
  markLessonComplete: (courseRoot: string, modulePath: string, lessonPath: string) => Promise<CourseProgress>
  unmarkLessonComplete: (courseRoot: string, modulePath: string, lessonPath: string) => Promise<CourseProgress>
  getSession: () => Promise<SessionData>
  saveSession: (data: Partial<SessionData>) => Promise<void>
  setTitleBarOverlay: (options: { isDark: boolean }) => Promise<void>
  onFileSystemChange: (callback: (event: FileSystemChangeEvent) => void) => () => void
}

interface Window {
  electronAPI: ElectronAPI
}
