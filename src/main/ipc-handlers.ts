import { BrowserWindow, dialog, ipcMain } from 'electron/main'
import {
  readDirectory,
  readFileContent,
  writeFileContent,
  createFile,
  createDirectory,
  renameEntry,
  deleteEntry
} from './lib/file-service'
import { startWatching } from './lib/file-watcher'
import { getSession, saveSession } from './lib/session-store'

export function registerIpcHandlers(): void {
  ipcMain.handle('dialog:openFolder', async () => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return null
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const folderPath = result.filePaths[0]
    await startWatching(folderPath)
    return folderPath
  })

  ipcMain.handle('fs:readDirectory', async (_event, directoryPath: string) => {
    return readDirectory(directoryPath)
  })

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    return readFileContent(filePath)
  })

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    await writeFileContent(filePath, content)
  })

  ipcMain.handle('fs:createFile', async (_event, parentPath: string, fileName: string) => {
    return createFile(parentPath, fileName)
  })

  ipcMain.handle('fs:createDirectory', async (_event, parentPath: string, dirName: string) => {
    return createDirectory(parentPath, dirName)
  })

  ipcMain.handle('fs:rename', async (_event, oldPath: string, newName: string) => {
    return renameEntry(oldPath, newName)
  })

  ipcMain.handle('fs:delete', async (_event, entryPath: string) => {
    await deleteEntry(entryPath)
  })

  ipcMain.handle('session:get', () => {
    return getSession()
  })

  ipcMain.handle('session:save', (_event, data: Record<string, unknown>) => {
    saveSession(data)
  })
}
