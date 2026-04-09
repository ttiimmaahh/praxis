import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { getTitleBarOverlayForIsDark } from './lib/title-bar-overlay'
import { checkForUpdates, downloadUpdate, quitAndInstall } from './lib/auto-updater'
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
import {
  getCourseProgress,
  markLessonComplete,
  unmarkLessonComplete
} from './lib/progress-store'
import {
  listTemplates,
  getTemplatesDir,
  setCustomTemplatesDir,
  ensureTemplatesSeeded
} from './lib/template-store'
import {
  handleExportDocumentHtml,
  handleExportDocumentPdf,
  handleExportCourseHtml,
  handleExportCoursePdf
} from './lib/export/export-handlers'

export function registerIpcHandlers(): void {
  // Initialize custom templates dir from saved session
  const session = getSession()
  if (session.templatesDir) {
    setCustomTemplatesDir(session.templatesDir)
  }

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

  ipcMain.handle(
    'course:createNewCourseFolder',
    async (_event, templateId?: string, courseName?: string) => {
      const window = BrowserWindow.getFocusedWindow()
      if (!window) return null
      const result = await dialog.showOpenDialog(window, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Choose where to create the course folder'
      })
      if (result.canceled || result.filePaths.length === 0) return null

      const parentPath = result.filePaths[0]
      let courseFolder: string

      if (courseName && courseName.trim().length > 0) {
        const { mkdir } = await import('fs/promises')
        const { join } = await import('path')
        courseFolder = join(parentPath, courseName.trim())
        try {
          await mkdir(courseFolder, { recursive: true })
        } catch {
          return { ok: false as const, error: `Could not create folder "${courseName.trim()}".` }
        }
      } else {
        courseFolder = parentPath
      }

      const scaffoldResult = await scaffoldCourse(courseFolder, templateId, courseName?.trim())
      if (!scaffoldResult.ok) {
        return { ok: false as const, error: scaffoldResult.error }
      }
      await startWatching(courseFolder)
      return { ok: true as const, folderPath: courseFolder }
    }
  )

  ipcMain.handle('course:scaffold', async (_event, courseRoot: string, templateId?: string) => {
    if (typeof courseRoot !== 'string' || courseRoot.trim() === '') {
      return { ok: false as const, error: 'Invalid path.' }
    }
    const scaffoldResult = await scaffoldCourse(courseRoot, templateId)
    if (!scaffoldResult.ok) {
      return scaffoldResult
    }
    await startWatching(courseRoot)
    return { ok: true as const }
  })

  ipcMain.handle('templates:list', () => {
    return listTemplates()
  })

  ipcMain.handle('templates:getDir', () => {
    return getTemplatesDir()
  })

  ipcMain.handle('templates:openDir', async () => {
    const dir = getTemplatesDir()
    ensureTemplatesSeeded()
    await shell.openPath(dir)
  })

  ipcMain.handle('templates:setDir', (_event, dir: string | null) => {
    setCustomTemplatesDir(dir)
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

  ipcMain.handle('progress:get', (_event, courseRoot: string) => {
    return getCourseProgress(courseRoot)
  })

  ipcMain.handle(
    'progress:markComplete',
    (_event, courseRoot: string, modulePath: string, lessonPath: string) => {
      return markLessonComplete(courseRoot, modulePath, lessonPath)
    }
  )

  ipcMain.handle(
    'progress:unmarkComplete',
    (_event, courseRoot: string, modulePath: string, lessonPath: string) => {
      return unmarkLessonComplete(courseRoot, modulePath, lessonPath)
    }
  )

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('updater:checkForUpdates', async () => {
    await checkForUpdates()
  })

  ipcMain.handle('updater:downloadUpdate', async () => {
    await downloadUpdate()
  })

  ipcMain.handle('updater:quitAndInstall', () => {
    quitAndInstall()
  })

  ipcMain.handle('export:documentHtml', (_event, payload: DocumentExportPayload) =>
    handleExportDocumentHtml(payload)
  )

  ipcMain.handle('export:documentPdf', (_event, payload: DocumentPdfExportPayload) =>
    handleExportDocumentPdf(payload)
  )

  ipcMain.handle('export:courseHtml', (_event, payload: CourseExportPayload) =>
    handleExportCourseHtml(payload)
  )

  ipcMain.handle('export:coursePdf', (_event, payload: CoursePdfExportPayload) =>
    handleExportCoursePdf(payload)
  )

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
