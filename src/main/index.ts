import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { getWindowState, trackWindowState } from './lib/window-state'
import { getTitleBarOverlayOptions } from './lib/title-bar-overlay'
import { registerIpcHandlers } from './ipc-handlers'

const isMac = process.platform === 'darwin'

function createWindow(): BrowserWindow {
  const state = getWindowState()

  const mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 680,
    minHeight: 400,
    show: false,
    titleBarStyle: 'hidden',
    ...(isMac
      ? {
          trafficLightPosition: { x: 16, y: 21 },
          // Opaque window: transparent + vibrancy often shows a 1px edge artifact on macOS;
          // solid backgroundColor matches app chrome (sidebar, oklch(0.935) ≈ #EDEDED).
          transparent: false,
          backgroundColor: '#EDEDED'
        }
      : {
          titleBarOverlay: getTitleBarOverlayOptions()
        }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (state.isMaximized) {
    mainWindow.maximize()
  }

  trackWindowState(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
