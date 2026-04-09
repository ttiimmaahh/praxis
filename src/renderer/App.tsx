import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/components/layout/AppShell'
import { UpdateNotification } from '@/components/layout/UpdateNotification'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useAppearanceStore } from '@/stores/appearance-store'
import { useExportStore } from '@/stores/export-store'
import { useUpdateStore } from '@/stores/update-store'
import { useAppearanceSystemListener } from '@/hooks/use-appearance-system-listener'
import { useCourseManifestSync } from '@/hooks/use-course-manifest-sync'
import { useCourseSidebarStore } from '@/stores/course-sidebar-store'

function App(): React.JSX.Element {
  const initialized = useRef(false)
  useAppearanceSystemListener()
  useCourseManifestSync()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    window.electronAPI.getSession().then((session) => {
      const store = useWorkspaceStore.getState()
      if (session.reopenLastFolder && session.rootPath) {
        store.setRootPath(session.rootPath)
        for (const file of session.openFiles ?? []) {
          store.openFile(file.filePath, file.fileName)
        }
        if (session.activeFilePath) {
          store.setActiveTab(session.activeFilePath)
        }
      }
      if (session.sidebarWidth) {
        store.setSidebarWidth(session.sidebarWidth)
      }

      useAppearanceStore.getState().hydrate({
        themeMode: session.themeMode,
        editorFontPreset: session.editorFontPreset,
        editorFontSizePx: session.editorFontSizePx,
        editorLineHeight: session.editorLineHeight
      })

      useExportStore.getState().hydrate({
        exportTheme: session.exportTheme,
        exportPageSize: session.exportPageSize,
        exportOrientation: session.exportOrientation
      })

      if (typeof session.courseProjectFilesExpanded === 'boolean') {
        useCourseSidebarStore.getState().hydrate(session.courseProjectFilesExpanded)
      }
    })
  }, [])

  useEffect(() => {
    const unsubAvailable = window.electronAPI.onUpdateAvailable((info) => {
      const { setAvailable, manualCheckPending, setManualCheckPending } =
        useUpdateStore.getState()
      setAvailable(info.version)
      if (manualCheckPending) {
        setManualCheckPending(false)
      }
    })

    const unsubNotAvailable = window.electronAPI.onUpdateNotAvailable(() => {
      const { manualCheckPending, setManualCheckPending } = useUpdateStore.getState()
      if (manualCheckPending) {
        setManualCheckPending(false)
        toast.success("You're on the latest version")
      }
    })

    const unsubDownloaded = window.electronAPI.onUpdateDownloaded((info) => {
      useUpdateStore.getState().setDownloaded(info.version)
    })

    const unsubError = window.electronAPI.onUpdateError((info) => {
      const { setError, manualCheckPending, setManualCheckPending } = useUpdateStore.getState()
      setError(info.message)
      if (manualCheckPending) {
        setManualCheckPending(false)
        toast.error('Update check failed', { description: info.message })
      }
    })

    return () => {
      unsubAvailable()
      unsubNotAvailable()
      unsubDownloaded()
      unsubError()
    }
  }, [])

  useEffect(() => {
    const lastSavedRef = { current: '' }

    const buildSessionPayload = () => {
      const state = useWorkspaceStore.getState()
      const appearance = useAppearanceStore.getState()
      const courseSidebar = useCourseSidebarStore.getState()
      return {
        rootPath: state.rootPath,
        openFiles: state.openTabs.map((tab) => ({
          filePath: tab.filePath,
          fileName: tab.fileName
        })),
        activeFilePath: state.activeTabPath,
        sidebarWidth: state.sidebarWidth,
        themeMode: appearance.themeMode,
        editorFontPreset: appearance.editorFontPreset,
        editorFontSizePx: appearance.editorFontSizePx,
        editorLineHeight: appearance.editorLineHeight,
        courseProjectFilesExpanded: courseSidebar.projectFilesOpen
      }
    }

    const saveInterval = setInterval(() => {
      const payload = buildSessionPayload()
      const serialized = JSON.stringify(payload)
      if (serialized !== lastSavedRef.current) {
        lastSavedRef.current = serialized
        window.electronAPI.saveSession(payload)
      }
    }, 5000)

    const handleBeforeUnload = (): void => {
      window.electronAPI.saveSession(buildSessionPayload())
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(saveInterval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppShell />
      </div>
      <UpdateNotification />
      <Toaster position="bottom-left" />
    </TooltipProvider>
  )
}

export default App
