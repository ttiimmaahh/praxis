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

interface SessionData {
  rootPath: string | null
  openFiles: Array<{ filePath: string; fileName: string }>
  activeFilePath: string | null
  sidebarWidth: number
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
  getSession: () => Promise<SessionData>
  saveSession: (data: Partial<SessionData>) => Promise<void>
  onFileSystemChange: (callback: (event: FileSystemChangeEvent) => void) => () => void
}

interface Window {
  electronAPI: ElectronAPI
}
