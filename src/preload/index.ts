import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  platform: process.platform as 'darwin' | 'win32' | 'linux',

  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),

  openFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFolder'),

  readDirectory: (directoryPath: string): Promise<FileEntry[]> =>
    ipcRenderer.invoke('fs:readDirectory', directoryPath),

  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('fs:readFile', filePath),

  writeFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('fs:writeFile', filePath, content),

  createFile: (parentPath: string, fileName: string): Promise<string> =>
    ipcRenderer.invoke('fs:createFile', parentPath, fileName),

  createDirectory: (parentPath: string, dirName: string): Promise<string> =>
    ipcRenderer.invoke('fs:createDirectory', parentPath, dirName),

  rename: (oldPath: string, newName: string): Promise<string> =>
    ipcRenderer.invoke('fs:rename', oldPath, newName),

  delete: (entryPath: string): Promise<void> =>
    ipcRenderer.invoke('fs:delete', entryPath),

  searchWorkspace: (rootPath: string, query: string): Promise<WorkspaceSearchMatch[]> =>
    ipcRenderer.invoke('fs:searchWorkspace', rootPath, query),

  loadCourseManifest: (rootPath: string) => ipcRenderer.invoke('course:loadManifest', rootPath),

  createNewCourseFolder: (templateId?: string, courseName?: string) =>
    ipcRenderer.invoke('course:createNewCourseFolder', templateId, courseName),

  scaffoldCourseInWorkspace: (courseRoot: string, templateId?: string) =>
    ipcRenderer.invoke('course:scaffold', courseRoot, templateId),

  listTemplates: () => ipcRenderer.invoke('templates:list'),

  getTemplatesDir: (): Promise<string> => ipcRenderer.invoke('templates:getDir'),

  openTemplatesDir: (): Promise<void> => ipcRenderer.invoke('templates:openDir'),

  setTemplatesDir: (dir: string | null): Promise<void> =>
    ipcRenderer.invoke('templates:setDir', dir),

  addCourseModule: (courseRoot: string) => ipcRenderer.invoke('course:addModule', courseRoot),

  addCourseLesson: (courseRoot: string, modulePath: string) =>
    ipcRenderer.invoke('course:addLesson', courseRoot, modulePath),

  getSession: (): Promise<SessionData> => ipcRenderer.invoke('session:get'),

  saveSession: (data: Partial<SessionData>): Promise<void> =>
    ipcRenderer.invoke('session:save', data),

  getCourseProgress: (courseRoot: string): Promise<CourseProgress> =>
    ipcRenderer.invoke('progress:get', courseRoot),

  markLessonComplete: (
    courseRoot: string,
    modulePath: string,
    lessonPath: string
  ): Promise<CourseProgress> =>
    ipcRenderer.invoke('progress:markComplete', courseRoot, modulePath, lessonPath),

  unmarkLessonComplete: (
    courseRoot: string,
    modulePath: string,
    lessonPath: string
  ): Promise<CourseProgress> =>
    ipcRenderer.invoke('progress:unmarkComplete', courseRoot, modulePath, lessonPath),

  setTitleBarOverlay: (options: { isDark: boolean }): Promise<void> =>
    ipcRenderer.invoke('window:setTitleBarOverlay', options),

  onFileSystemChange: (callback: (event: FileSystemChangeEvent) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: FileSystemChangeEvent): void => {
      callback(data)
    }
    ipcRenderer.on('fs:change', handler)
    return () => ipcRenderer.removeListener('fs:change', handler)
  },

  checkForUpdates: (): Promise<void> => ipcRenderer.invoke('updater:checkForUpdates'),

  quitAndInstall: (): Promise<void> => ipcRenderer.invoke('updater:quitAndInstall'),

  onUpdateAvailable: (callback: (info: UpdateEventInfo) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: UpdateEventInfo): void => {
      callback(data)
    }
    ipcRenderer.on('updater:available', handler)
    return () => ipcRenderer.removeListener('updater:available', handler)
  },

  onUpdateDownloaded: (callback: (info: UpdateEventInfo) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: UpdateEventInfo): void => {
      callback(data)
    }
    ipcRenderer.on('updater:downloaded', handler)
    return () => ipcRenderer.removeListener('updater:downloaded', handler)
  },

  onUpdateError: (callback: (info: UpdateErrorInfo) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: UpdateErrorInfo): void => {
      callback(data)
    }
    ipcRenderer.on('updater:error', handler)
    return () => ipcRenderer.removeListener('updater:error', handler)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
