import { watch, type FSWatcher } from 'chokidar'
import { BrowserWindow } from 'electron'

let watcher: FSWatcher | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 300

function sendToAllWindows(channel: string, data: unknown): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, data)
    }
  }
}

export async function startWatching(rootPath: string): Promise<void> {
  await stopWatching()

  watcher = watch(rootPath, {
    ignored: [
      /(^|[/\\])\./,
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/out/**'
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 50
    }
  })

  watcher.on('all', (eventType, filePath) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      sendToAllWindows('fs:change', { type: eventType, path: filePath })
    }, DEBOUNCE_MS)
  })
}

export async function stopWatching(): Promise<void> {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  if (watcher) {
    await watcher.close()
    watcher = null
  }
}
