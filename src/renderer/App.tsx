import { useEffect, useRef } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/layout/AppShell'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useAppearanceStore } from '@/stores/appearance-store'
import { useAppearanceSystemListener } from '@/hooks/use-appearance-system-listener'

function App(): React.JSX.Element {
  const initialized = useRef(false)
  useAppearanceSystemListener()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    window.electronAPI.getSession().then((session) => {
      const store = useWorkspaceStore.getState()
      if (session.rootPath) {
        store.setRootPath(session.rootPath)
      }
      if (session.sidebarWidth) {
        store.setSidebarWidth(session.sidebarWidth)
      }
      for (const file of session.openFiles ?? []) {
        store.openFile(file.filePath, file.fileName)
      }
      if (session.activeFilePath) {
        store.setActiveTab(session.activeFilePath)
      }

      useAppearanceStore.getState().hydrate({
        themeMode: session.themeMode,
        editorFontPreset: session.editorFontPreset,
        editorFontSizePx: session.editorFontSizePx,
        editorLineHeight: session.editorLineHeight
      })
    })
  }, [])

  useEffect(() => {
    const saveInterval = setInterval(() => {
      const state = useWorkspaceStore.getState()
      const appearance = useAppearanceStore.getState()
      window.electronAPI.saveSession({
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
        editorLineHeight: appearance.editorLineHeight
      })
    }, 5000)

    const handleBeforeUnload = (): void => {
      const state = useWorkspaceStore.getState()
      const appearance = useAppearanceStore.getState()
      window.electronAPI.saveSession({
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
        editorLineHeight: appearance.editorLineHeight
      })
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
    </TooltipProvider>
  )
}

export default App
