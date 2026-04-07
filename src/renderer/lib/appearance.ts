export type ThemeMode = 'light' | 'dark' | 'system'

export type EditorFontPreset = 'system' | 'serif' | 'mono'

export interface AppearanceState {
  themeMode: ThemeMode
  editorFontPreset: EditorFontPreset
  editorFontSizePx: number
  editorLineHeight: number
}

export const DEFAULT_APPEARANCE: AppearanceState = {
  themeMode: 'system',
  editorFontPreset: 'system',
  editorFontSizePx: 16,
  editorLineHeight: 1.65
}

const FONT_STACKS: Record<EditorFontPreset, string> = {
  system: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  serif: `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`,
  mono: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace`
}

export function fontStackForPreset(preset: EditorFontPreset): string {
  return FONT_STACKS[preset]
}

export function computeIsDark(themeMode: ThemeMode): boolean {
  if (themeMode === 'dark') return true
  if (themeMode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyAppearanceToDocument(state: AppearanceState): void {
  const root = document.documentElement
  const dark = computeIsDark(state.themeMode)
  root.classList.toggle('dark', dark)
  root.dataset.theme = dark ? 'dark' : 'light'
  root.dataset.themeMode = state.themeMode

  const fontStack = fontStackForPreset(state.editorFontPreset)
  root.style.setProperty('--app-font-family', fontStack)
  root.style.setProperty('--editor-font-body', fontStack)
  root.style.setProperty('--editor-font-title', fontStack)
  root.style.setProperty('--editor-font-size', `${state.editorFontSizePx}px`)
  root.style.setProperty('--editor-line-height', String(state.editorLineHeight))
  /* Crepe reset.css uses fixed px sizes; scale them from a 16px baseline. */
  root.style.setProperty('--editor-scale', String(state.editorFontSizePx / 16))

  if (window.electronAPI.platform !== 'darwin') {
    void window.electronAPI.setTitleBarOverlay({ isDark: dark })
  }
}
