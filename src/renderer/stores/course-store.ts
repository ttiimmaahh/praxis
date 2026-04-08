import { create } from 'zustand'
import type { CourseManifestParsed, LoadCourseManifestResult } from '@shared/course-manifest'

export type CourseLoadStatus = 'idle' | 'no-manifest' | 'loading' | 'invalid' | 'ready'

interface CourseState {
  status: CourseLoadStatus
  manifest: CourseManifestParsed | null
  errors: string[]
  warnings: string[]
  /** Last workspace root we finished loading; used to refresh in the background without clearing the sidebar. */
  lastLoadedRoot: string | null
  reset: () => void
  hydrateFromResult: (result: LoadCourseManifestResult) => void
  loadForRoot: (rootPath: string | null) => Promise<void>
}

export const useCourseStore = create<CourseState>()((set, get) => ({
  status: 'idle',
  manifest: null,
  errors: [],
  warnings: [],
  lastLoadedRoot: null,

  reset: () =>
    set({
      status: 'idle',
      manifest: null,
      errors: [],
      warnings: [],
      lastLoadedRoot: null
    }),

  hydrateFromResult: (result) => {
    if (result.status === 'no-manifest') {
      set({
        status: 'no-manifest',
        manifest: null,
        errors: [],
        warnings: []
      })
      return
    }
    if (result.status === 'invalid') {
      set({
        status: 'invalid',
        manifest: null,
        errors: result.errors,
        warnings: []
      })
      return
    }
    set({
      status: 'ready',
      manifest: result.manifest,
      errors: [],
      warnings: result.warnings
    })
  },

  loadForRoot: async (rootPath) => {
    if (!rootPath) {
      get().reset()
      return
    }
    const { lastLoadedRoot } = get()
    const backgroundRefresh = lastLoadedRoot === rootPath
    if (!backgroundRefresh) {
      set({ status: 'loading', errors: [], warnings: [] })
    }
    try {
      const result = await window.electronAPI.loadCourseManifest(rootPath)
      get().hydrateFromResult(result)
      set({ lastLoadedRoot: rootPath })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      set({
        status: 'invalid',
        manifest: null,
        errors: [message],
        warnings: [],
        lastLoadedRoot: rootPath
      })
    }
  }
}))
