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
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  rootPath: null,
  openTabs: [],
  activeTabPath: null,
  sidebarWidth: 260,
  outlineOpen: true,
  commandPaletteOpen: false,
  workspaceSearchOpen: false,

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

  setWorkspaceSearchOpen: (open) => set({ workspaceSearchOpen: open })
}))
