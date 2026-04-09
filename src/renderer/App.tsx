import { useEffect, useRef } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/layout/AppShell'
import { UpdateNotification } from '@/components/layout/UpdateNotification'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useAppearanceStore } from '@/stores/appearance-store'
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

      if (typeof session.courseProjectFilesExpanded === 'boolean') {
        useCourseSidebarStore.getState().hydrate(session.courseProjectFilesExpanded)
      }
    })
  }, [])

  useEffect(() => {
    const { setAvailable, setDownloaded, setError } = useUpdateStore.getState()

    const unsubAvailable = window.electronAPI.onUpdateAvailable((info) => {
      setAvailable(info.version)
    })
    const unsubDownloaded = window.electronAPI.onUpdateDownloaded((info) => {
      setDownloaded(info.version)
    })
    const unsubError = window.electronAPI.onUpdateError((info) => {
      setError(info.message)
    })

    return () => {
      unsubAvailable()
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
    </TooltipProvider>
  )
}

export default App
