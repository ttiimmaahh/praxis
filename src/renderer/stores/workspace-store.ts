import { create } from 'zustand'

export interface FileTab {
  filePath: string
  fileName: string
  isDirty: boolean
}

interface WorkspaceState {
  rootPath: string | null
  openTabs: FileTab[]
  activeTabPath: string | null
  sidebarWidth: number
  outlineOpen: boolean
  commandPaletteOpen: boolean
  workspaceSearchOpen: boolean
  templatePickerOpen: boolean
  /** 'new' = create new course folder, 'scaffold' = scaffold in current folder */
  templatePickerMode: 'new' | 'scaffold'
  /** When true, skip auto-entering learner mode on next manifest load (e.g. after scaffolding) */
  suppressLearnerAutoEnter: boolean

  setRootPath: (path: string | null) => void
  openFile: (filePath: string, fileName: string) => void
  closeFile: (filePath: string) => void
  setActiveTab: (filePath: string) => void
  markDirty: (filePath: string, isDirty: boolean) => void
  setSidebarWidth: (width: number) => void
  setOutlineOpen: (open: boolean) => void
  toggleOutline: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setWorkspaceSearchOpen: (open: boolean) => void
  setTemplatePickerOpen: (open: boolean) => void
  openTemplatePicker: (mode: 'new' | 'scaffold') => void
  setSuppressLearnerAutoEnter: (suppress: boolean) => void
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  rootPath: null,
  openTabs: [],
  activeTabPath: null,
  sidebarWidth: 260,
  outlineOpen: true,
  commandPaletteOpen: false,
  workspaceSearchOpen: false,
  templatePickerOpen: false,
  templatePickerMode: 'new' as const,
  suppressLearnerAutoEnter: false,

  setRootPath: (path) => set({ rootPath: path }),

  openFile: (filePath, fileName) => {
    const { openTabs } = get()
    const existing = openTabs.find((tab) => tab.filePath === filePath)
    if (!existing) {
      set({
        openTabs: [...openTabs, { filePath, fileName, isDirty: false }],
        activeTabPath: filePath
      })
    } else {
      set({ activeTabPath: filePath })
    }
  },

  closeFile: (filePath) => {
    const { openTabs, activeTabPath } = get()
    const filtered = openTabs.filter((tab) => tab.filePath !== filePath)
    const nextActive =
      activeTabPath === filePath
        ? filtered.length > 0
          ? filtered[filtered.length - 1].filePath
          : null
        : activeTabPath
    set({ openTabs: filtered, activeTabPath: nextActive })
  },

  setActiveTab: (filePath) => set({ activeTabPath: filePath }),

  markDirty: (filePath, isDirty) =>
    set((state) => ({
      openTabs: state.openTabs.map((tab) =>
        tab.filePath === filePath ? { ...tab, isDirty } : tab
      )
    })),

  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  setOutlineOpen: (open) => set({ outlineOpen: open }),

  toggleOutline: () => set((s) => ({ outlineOpen: !s.outlineOpen })),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  setWorkspaceSearchOpen: (open) => set({ workspaceSearchOpen: open }),

  setTemplatePickerOpen: (open) => set({ templatePickerOpen: open }),

  openTemplatePicker: (mode) => set({ templatePickerOpen: true, templatePickerMode: mode }),

  setSuppressLearnerAutoEnter: (suppress) => set({ suppressLearnerAutoEnter: suppress })
}))
