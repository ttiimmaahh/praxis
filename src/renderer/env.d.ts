// Data types shared with main/preload live in `src/shared/global.d.ts`.
// Only renderer-specific declarations (DOM augmentations, course-manifest
// duplicates still referenced by ElectronAPI below) remain here.

type CourseLessonRef = {
  path: string
  title?: string
}

type CourseModuleManifest = {
  path: string
  title?: string
  lessons: CourseLessonRef[]
}

type SchemaField = {
  name: string
  required: boolean
  type: 'string' | 'number'
}

type CourseSchema = {
  lessonFields: SchemaField[]
}

type CourseManifestParsed = {
  title: string
  modules: CourseModuleManifest[]
  schema?: CourseSchema
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

interface CourseTemplateMeta {
  id: string
  name: string
  description: string
  builtIn: boolean
}

interface ElectronAPI {
  platform: 'darwin' | 'win32' | 'linux'
  getVersion: () => Promise<string>
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
  createNewCourseFolder: (templateId?: string, courseName?: string) => Promise<CreateNewCourseFolderResult>
  scaffoldCourseInWorkspace: (courseRoot: string, templateId?: string) => Promise<CourseAuthoringResult>
  listTemplates: () => Promise<CourseTemplateMeta[]>
  getTemplatesDir: () => Promise<string>
  openTemplatesDir: () => Promise<void>
  setTemplatesDir: (dir: string | null) => Promise<void>
  addCourseModule: (courseRoot: string) => Promise<CourseAuthoringResult>
  addCourseLesson: (courseRoot: string, modulePath: string) => Promise<CourseAuthoringResult>
  getCourseProgress: (courseRoot: string) => Promise<CourseProgress>
  markLessonComplete: (courseRoot: string, modulePath: string, lessonPath: string) => Promise<CourseProgress>
  unmarkLessonComplete: (courseRoot: string, modulePath: string, lessonPath: string) => Promise<CourseProgress>
  getSession: () => Promise<SessionData>
  saveSession: (data: Partial<SessionData>) => Promise<void>
  exportDocumentHtml: (payload: DocumentExportPayload) => Promise<string | null>
  exportDocumentPdf: (payload: DocumentPdfExportPayload) => Promise<string | null>
  exportCourseHtml: (payload: CourseExportPayload) => Promise<string | null>
  exportCoursePdf: (payload: CoursePdfExportPayload) => Promise<string | null>
  setTitleBarOverlay: (options: { isDark: boolean }) => Promise<void>
  onFileSystemChange: (callback: (event: FileSystemChangeEvent) => void) => () => void
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  quitAndInstall: () => Promise<void>
  onUpdateAvailable: (callback: (info: UpdateEventInfo) => void) => () => void
  onUpdateNotAvailable: (callback: (info: UpdateEventInfo) => void) => () => void
  onUpdateDownloaded: (callback: (info: UpdateEventInfo) => void) => () => void
  onUpdateError: (callback: (info: UpdateErrorInfo) => void) => () => void
}

interface Window {
  electronAPI: ElectronAPI
}
