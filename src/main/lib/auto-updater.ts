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

  // Manual download flow: the renderer decides when to actually pull bits
  // so the user sees an explicit "Download" affordance in the update toast.
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.logger = console

  autoUpdater.on('checking-for-update', () => {
    console.log('[auto-updater] checking for update')
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log('[auto-updater] update available', info.version)
    sendToRenderer('updater:available', { version: info.version, releaseNotes: info.releaseNotes })
  })

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    console.log('[auto-updater] update not available', info.version)
    sendToRenderer('updater:not-available', { version: info.version })
  })

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[auto-updater] download progress ${progress.percent.toFixed(1)}%`)
    sendToRenderer('updater:progress', { percent: progress.percent })
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    console.log('[auto-updater] update downloaded', info.version)
    sendToRenderer('updater:downloaded', { version: info.version, releaseNotes: info.releaseNotes })
  })

  autoUpdater.on('error', (err: Error) => {
    console.error('[auto-updater] error', err)
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

export function downloadUpdate(): Promise<void> {
  return autoUpdater.downloadUpdate().then(() => undefined)
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall(false, true)
}
