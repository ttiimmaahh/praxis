import { nativeTheme } from 'electron'
import { getSession } from './session-store'

export type TitleBarOverlayShape = {
  color: string
  symbolColor: string
  height: number
}

function resolveIsDarkFromSession(): boolean {
  const session = getSession()
  const mode = session.themeMode ?? 'system'
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return nativeTheme.shouldUseDarkColors
}

/** Overlay colors for `titleBarStyle: 'hidden'` on Windows / Linux (not macOS). */
export function getTitleBarOverlayOptions(): TitleBarOverlayShape {
  const dark = resolveIsDarkFromSession()
  if (dark) {
    return { color: '#1a1a1a', symbolColor: '#e8e8e8', height: 38 }
  }
  return { color: '#ececec', symbolColor: '#2a2a2a', height: 38 }
}

export function getTitleBarOverlayForIsDark(isDark: boolean): TitleBarOverlayShape {
  if (isDark) {
    return { color: '#1a1a1a', symbolColor: '#e8e8e8', height: 38 }
  }
  return { color: '#ececec', symbolColor: '#2a2a2a', height: 38 }
}
