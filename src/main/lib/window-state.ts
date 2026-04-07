import { BrowserWindow, screen } from 'electron'
import { JsonStore } from './json-store'

interface WindowState {
  x: number | undefined
  y: number | undefined
  width: number
  height: number
  isMaximized: boolean
}

const DEFAULTS: WindowState = {
  x: undefined,
  y: undefined,
  width: 1200,
  height: 800,
  isMaximized: false
}

const SAVE_DEBOUNCE_MS = 500

let store: JsonStore<{ windowState: WindowState }>

function getStore(): JsonStore<{ windowState: WindowState }> {
  if (!store) {
    store = new JsonStore({ fileName: 'window-state.json', defaults: { windowState: DEFAULTS } })
  }
  return store
}

function isWithinDisplayBounds(state: WindowState): boolean {
  const displays = screen.getAllDisplays()
  return displays.some((display) => {
    const { x, y, width, height } = display.bounds
    return (
      state.x !== undefined &&
      state.y !== undefined &&
      state.x >= x - 50 &&
      state.y >= y - 50 &&
      state.x < x + width + 50 &&
      state.y < y + height + 50
    )
  })
}

export function getWindowState(): WindowState {
  const saved = getStore().get('windowState')
  if (saved.x !== undefined && saved.y !== undefined && !isWithinDisplayBounds(saved)) {
    return { ...DEFAULTS }
  }
  return saved
}

export function trackWindowState(window: BrowserWindow): void {
  let saveTimeout: ReturnType<typeof setTimeout> | null = null

  function saveState(): void {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      const isMaximized = window.isMaximized()
      const bounds = isMaximized ? getStore().get('windowState') : window.getBounds()
      getStore().set('windowState', {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized
      })
    }, SAVE_DEBOUNCE_MS)
  }

  window.on('resize', saveState)
  window.on('move', saveState)
  window.on('maximize', saveState)
  window.on('unmaximize', saveState)
  window.on('close', () => {
    if (saveTimeout) clearTimeout(saveTimeout)
    const isMaximized = window.isMaximized()
    const bounds = isMaximized ? getStore().get('windowState') : window.getBounds()
    getStore().set('windowState', {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized
    })
  })
}
