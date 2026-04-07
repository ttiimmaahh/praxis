import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
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

  getSession: (): Promise<SessionData> => ipcRenderer.invoke('session:get'),

  saveSession: (data: Partial<SessionData>): Promise<void> =>
    ipcRenderer.invoke('session:save', data),

  onFileSystemChange: (callback: (event: FileSystemChangeEvent) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: FileSystemChangeEvent): void => {
      callback(data)
    }
    ipcRenderer.on('fs:change', handler)
    return () => ipcRenderer.removeListener('fs:change', handler)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
