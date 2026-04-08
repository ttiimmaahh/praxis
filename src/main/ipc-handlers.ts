import { BrowserWindow, dialog, ipcMain } from 'electron'
import { getTitleBarOverlayForIsDark } from './lib/title-bar-overlay'
import {
  readDirectory,
  readFileContent,
  writeFileContent,
  createFile,
  createDirectory,
  renameEntry,
  deleteEntry
} from './lib/file-service'
import { searchWorkspaceMarkdown } from './lib/workspace-search'
import { startWatching } from './lib/file-watcher'
import { getSession, saveSession } from './lib/session-store'
import { loadCourseManifest } from './lib/load-course-manifest'
import {
  scaffoldCourse,
  addModuleToCourse,
  addLessonToModule
} from './lib/course-authoring'

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

  ipcMain.handle('fs:searchWorkspace', async (_event, rootPath: string, query: string) => {
    return searchWorkspaceMarkdown(rootPath, query)
  })

  ipcMain.handle('course:loadManifest', async (_event, rootPath: string) => {
    return loadCourseManifest(rootPath)
  })

  ipcMain.handle('course:createNewCourseFolder', async () => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return null
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select or create a folder for the new course'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const folderPath = result.filePaths[0]
    const scaffoldResult = await scaffoldCourse(folderPath)
    if (!scaffoldResult.ok) {
      return { ok: false as const, error: scaffoldResult.error }
    }
    await startWatching(folderPath)
    return { ok: true as const, folderPath }
  })

  ipcMain.handle('course:scaffold', async (_event, courseRoot: string) => {
    if (typeof courseRoot !== 'string' || courseRoot.trim() === '') {
      return { ok: false as const, error: 'Invalid path.' }
    }
    const scaffoldResult = await scaffoldCourse(courseRoot)
    if (!scaffoldResult.ok) {
      return scaffoldResult
    }
    await startWatching(courseRoot)
    return { ok: true as const }
  })

  ipcMain.handle('course:addModule', async (_event, courseRoot: string) => {
    if (typeof courseRoot !== 'string' || courseRoot.trim() === '') {
      return { ok: false as const, error: 'Invalid path.' }
    }
    return addModuleToCourse(courseRoot)
  })

  ipcMain.handle('course:addLesson', async (_event, courseRoot: string, modulePath: string) => {
    if (typeof courseRoot !== 'string' || typeof modulePath !== 'string') {
      return { ok: false as const, error: 'Invalid path.' }
    }
    return addLessonToModule(courseRoot, modulePath)
  })

  ipcMain.handle('session:get', () => {
    return getSession()
  })

  ipcMain.handle('session:save', (_event, data: Record<string, unknown>) => {
    saveSession(data)
  })

  ipcMain.handle('window:setTitleBarOverlay', (event, payload: { isDark: boolean }) => {
    if (process.platform === 'darwin') return
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    try {
      win.setTitleBarOverlay(getTitleBarOverlayForIsDark(payload.isDark))
    } catch (error) {
      console.error('[window:setTitleBarOverlay]', error)
    }
  })
}
