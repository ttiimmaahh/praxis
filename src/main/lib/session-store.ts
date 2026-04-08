import { JsonStore } from './json-store'

export type ThemeMode = 'light' | 'dark' | 'system'
export type EditorFontPreset = 'system' | 'serif' | 'mono'

interface SessionData {
  rootPath: string | null
  openFiles: Array<{ filePath: string; fileName: string }>
  activeFilePath: string | null
  sidebarWidth: number
  themeMode?: ThemeMode
  editorFontPreset?: EditorFontPreset
  editorFontSizePx?: number
  editorLineHeight?: number
  /** When a course manifest is active: expanded state of the Project files tree in the sidebar. */
  courseProjectFilesExpanded?: boolean
  /** Whether to reopen the last folder on app launch. Defaults to false. */
  reopenLastFolder?: boolean
  /** Custom templates directory path. If unset, uses default userData/templates/. */
  templatesDir?: string
}

const DEFAULTS: SessionData = {
  rootPath: null,
  openFiles: [],
  activeFilePath: null,
  sidebarWidth: 260,
  themeMode: 'system',
  editorFontPreset: 'system',
  editorFontSizePx: 16,
  editorLineHeight: 1.65,
  courseProjectFilesExpanded: false,
  reopenLastFolder: false
}

let store: JsonStore<{ session: SessionData }>

function getStore(): JsonStore<{ session: SessionData }> {
  if (!store) {
    store = new JsonStore({ fileName: 'session.json', defaults: { session: DEFAULTS } })
  }
  return store
}

export function getSession(): SessionData {
  const stored = getStore().get('session')
  return { ...DEFAULTS, ...stored }
}

export function saveSession(data: Partial<SessionData>): void {
  const current = getStore().get('session')
  getStore().set('session', { ...DEFAULTS, ...current, ...data })
}
