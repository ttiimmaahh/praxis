import { create } from 'zustand'

type UpdateStatus = 'idle' | 'available' | 'downloading' | 'ready' | 'error'

interface UpdateStore {
  status: UpdateStatus
  newVersion: string | null
  errorMessage: string | null
  dismissed: boolean
  /**
   * Set when the user explicitly clicked "Check for updates" in Settings.
   * Consumed by the `update-not-available` handler to show a "you're on the
   * latest version" toast — background periodic checks should stay silent.
   */
  manualCheckPending: boolean
  setManualCheckPending: (pending: boolean) => void
  setAvailable: (version: string) => void
  startDownload: () => void
  setDownloaded: (version: string) => void
  setError: (message: string) => void
  dismiss: () => void
  reset: () => void
}

export const useUpdateStore = create<UpdateStore>()((set) => ({
  status: 'idle',
  newVersion: null,
  errorMessage: null,
  dismissed: false,
  manualCheckPending: false,

  setManualCheckPending: (pending) => set({ manualCheckPending: pending }),

  setAvailable: (version) =>
    set({ status: 'available', newVersion: version, errorMessage: null, dismissed: false }),

  startDownload: () => set({ status: 'downloading', dismissed: false }),

  setDownloaded: (version) =>
    set({ status: 'ready', newVersion: version, errorMessage: null, dismissed: false }),

  // Don't clobber a ready state — once an update is downloaded it stays ready
  // even if a later background check fails. Errors only show when we're not
  // already sitting on a usable download.
  setError: (message) =>
    set((s) =>
      s.status === 'ready' ? s : { status: 'error', errorMessage: message, dismissed: false }
    ),

  dismiss: () => set({ dismissed: true }),

  reset: () =>
    set({
      status: 'idle',
      newVersion: null,
      errorMessage: null,
      dismissed: false,
      manualCheckPending: false
    })
}))
