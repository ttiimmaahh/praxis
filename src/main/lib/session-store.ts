import { JsonStore } from './json-store'

interface SessionData {
  rootPath: string | null
  openFiles: Array<{ filePath: string; fileName: string }>
  activeFilePath: string | null
  sidebarWidth: number
}

const DEFAULTS: SessionData = {
  rootPath: null,
  openFiles: [],
  activeFilePath: null,
  sidebarWidth: 260
}

let store: JsonStore<{ session: SessionData }>

function getStore(): JsonStore<{ session: SessionData }> {
  if (!store) {
    store = new JsonStore({ fileName: 'session.json', defaults: { session: DEFAULTS } })
  }
  return store
}

export function getSession(): SessionData {
  return getStore().get('session')
}

export function saveSession(data: Partial<SessionData>): void {
  const current = getStore().get('session')
  getStore().set('session', { ...current, ...data })
}
