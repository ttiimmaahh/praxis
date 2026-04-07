import { create } from 'zustand'
import {
  applyAppearanceToDocument,
  DEFAULT_APPEARANCE,
  type AppearanceState,
  type EditorFontPreset,
  type ThemeMode
} from '@/lib/appearance'

function persistAppearanceSlice(state: AppearanceState): void {
  void window.electronAPI.saveSession({
    themeMode: state.themeMode,
    editorFontPreset: state.editorFontPreset,
    editorFontSizePx: state.editorFontSizePx,
    editorLineHeight: state.editorLineHeight
  })
}

interface AppearanceStore extends AppearanceState {
  setThemeMode: (mode: ThemeMode) => void
  setEditorFontPreset: (preset: EditorFontPreset) => void
  setEditorFontSizePx: (px: number) => void
  setEditorLineHeight: (value: number) => void
  hydrate: (partial: Partial<AppearanceState>) => void
}

function clampSize(px: number): number {
  return Math.min(22, Math.max(13, Math.round(px)))
}

function clampLineHeight(value: number): number {
  return Math.min(2, Math.max(1.35, Math.round(value * 100) / 100))
}

function toAppearanceState(s: AppearanceStore): AppearanceState {
  return {
    themeMode: s.themeMode,
    editorFontPreset: s.editorFontPreset,
    editorFontSizePx: s.editorFontSizePx,
    editorLineHeight: s.editorLineHeight
  }
}

export const useAppearanceStore = create<AppearanceStore>()((set, get) => ({
  ...DEFAULT_APPEARANCE,

  setThemeMode: (themeMode) => {
    set({ themeMode })
    const next = toAppearanceState(get())
    applyAppearanceToDocument(next)
    persistAppearanceSlice(next)
  },

  setEditorFontPreset: (editorFontPreset) => {
    set({ editorFontPreset })
    const next = toAppearanceState(get())
    applyAppearanceToDocument(next)
    persistAppearanceSlice(next)
  },

  setEditorFontSizePx: (editorFontSizePx) => {
    const v = clampSize(editorFontSizePx)
    set({ editorFontSizePx: v })
    const next = toAppearanceState(get())
    applyAppearanceToDocument(next)
    persistAppearanceSlice(next)
  },

  setEditorLineHeight: (editorLineHeight) => {
    const v = clampLineHeight(editorLineHeight)
    set({ editorLineHeight: v })
    const next = toAppearanceState(get())
    applyAppearanceToDocument(next)
    persistAppearanceSlice(next)
  },

  hydrate: (partial) => {
    const next: AppearanceState = {
      themeMode: partial.themeMode ?? DEFAULT_APPEARANCE.themeMode,
      editorFontPreset: partial.editorFontPreset ?? DEFAULT_APPEARANCE.editorFontPreset,
      editorFontSizePx: partial.editorFontSizePx
        ? clampSize(partial.editorFontSizePx)
        : DEFAULT_APPEARANCE.editorFontSizePx,
      editorLineHeight: partial.editorLineHeight
        ? clampLineHeight(partial.editorLineHeight)
        : DEFAULT_APPEARANCE.editorLineHeight
    }
    set(next)
    applyAppearanceToDocument(next)
  }
}))

applyAppearanceToDocument(DEFAULT_APPEARANCE)
