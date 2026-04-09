import { create } from 'zustand'

type UpdateStatus = 'idle' | 'available' | 'downloading' | 'ready' | 'error'

interface UpdateStore {
  status: UpdateStatus
  newVersion: string | null
  errorMessage: string | null
  dismissed: boolean
  setAvailable: (version: string) => void
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

  setAvailable: (version) => set({ status: 'downloading', newVersion: version, dismissed: false }),

  setDownloaded: (version) => set({ status: 'ready', newVersion: version, dismissed: false }),

  setError: (message) => set({ status: 'error', errorMessage: message }),

  dismiss: () => set({ dismissed: true }),

  reset: () => set({ status: 'idle', newVersion: null, errorMessage: null, dismissed: false })
}))
