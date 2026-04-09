import { BrowserWindow, app } from 'electron'
import { autoUpdater, UpdateInfo } from 'electron-updater'

let mainWindow: BrowserWindow | null = null

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000 // 4 hours
const STARTUP_DELAY_MS = 3000

function sendToRenderer(channel: string, ...args: unknown[]): void {
  mainWindow?.webContents.send(channel, ...args)
}

export function initAutoUpdater(window: BrowserWindow): void {
  if (!app.isPackaged) return

  mainWindow = window

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    sendToRenderer('updater:available', { version: info.version, releaseNotes: info.releaseNotes })
  })

  autoUpdater.on('download-progress', (progress) => {
    sendToRenderer('updater:progress', { percent: progress.percent })
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    sendToRenderer('updater:downloaded', { version: info.version, releaseNotes: info.releaseNotes })
  })

  autoUpdater.on('error', (err: Error) => {
    sendToRenderer('updater:error', { message: err.message })
  })

  // Check after a short startup delay, then periodically
  setTimeout(() => {
    autoUpdater.checkForUpdates()
    setInterval(() => autoUpdater.checkForUpdates(), CHECK_INTERVAL_MS)
  }, STARTUP_DELAY_MS)
}

export function checkForUpdates(): Promise<void> {
  return autoUpdater.checkForUpdates().then(() => undefined)
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall(false, true)
}
