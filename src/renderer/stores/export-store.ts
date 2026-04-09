import { create } from 'zustand'

export interface ExportPreferences {
  exportTheme: ExportTheme
  exportPageSize: ExportPageSize
  exportOrientation: ExportOrientation
}

interface ExportStore extends ExportPreferences {
  setExportTheme: (theme: ExportTheme) => void
  setExportPageSize: (size: ExportPageSize) => void
  setExportOrientation: (orientation: ExportOrientation) => void
  hydrate: (partial: Partial<ExportPreferences>) => void
}

const DEFAULTS: ExportPreferences = {
  exportTheme: 'light',
  exportPageSize: 'letter',
  exportOrientation: 'portrait'
}

function persistExportSlice(state: ExportPreferences): void {
  void window.electronAPI.saveSession({
    exportTheme: state.exportTheme,
    exportPageSize: state.exportPageSize,
    exportOrientation: state.exportOrientation
  })
}

function toPreferences(s: ExportStore): ExportPreferences {
  return {
    exportTheme: s.exportTheme,
    exportPageSize: s.exportPageSize,
    exportOrientation: s.exportOrientation
  }
}

export const useExportStore = create<ExportStore>()((set, get) => ({
  ...DEFAULTS,

  setExportTheme: (exportTheme) => {
    set({ exportTheme })
    persistExportSlice(toPreferences(get()))
  },

  setExportPageSize: (exportPageSize) => {
    set({ exportPageSize })
    persistExportSlice(toPreferences(get()))
  },

  setExportOrientation: (exportOrientation) => {
    set({ exportOrientation })
    persistExportSlice(toPreferences(get()))
  },

  hydrate: (partial) => {
    set({
      exportTheme: partial.exportTheme ?? DEFAULTS.exportTheme,
      exportPageSize: partial.exportPageSize ?? DEFAULTS.exportPageSize,
      exportOrientation: partial.exportOrientation ?? DEFAULTS.exportOrientation
    })
  }
}))
