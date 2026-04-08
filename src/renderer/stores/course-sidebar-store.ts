import { create } from 'zustand'

interface CourseSidebarState {
  /** When a course manifest is active, whether the full file tree section is expanded. */
  projectFilesOpen: boolean
  setProjectFilesOpen: (open: boolean) => void
  toggleProjectFiles: () => void
  hydrate: (projectFilesOpen: boolean) => void
}

export const useCourseSidebarStore = create<CourseSidebarState>()((set, get) => ({
  projectFilesOpen: false,

  setProjectFilesOpen: (open) => set({ projectFilesOpen: open }),

  toggleProjectFiles: () => set({ projectFilesOpen: !get().projectFilesOpen }),

  hydrate: (projectFilesOpen) => set({ projectFilesOpen })
}))

export function persistCourseProjectFilesExpanded(): void {
  void window.electronAPI.saveSession({
    courseProjectFilesExpanded: useCourseSidebarStore.getState().projectFilesOpen
  })
}
