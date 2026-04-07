import { useEffect, useRef } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/layout/AppShell'
import { useWorkspaceStore } from '@/stores/workspace-store'

function App(): React.JSX.Element {
  const initialized = useRef(false)

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
    })
  }, [])

  useEffect(() => {
    const saveInterval = setInterval(() => {
      const state = useWorkspaceStore.getState()
      window.electronAPI.saveSession({
        rootPath: state.rootPath,
        openFiles: state.openTabs.map((tab) => ({
          filePath: tab.filePath,
          fileName: tab.fileName
        })),
        activeFilePath: state.activeTabPath,
        sidebarWidth: state.sidebarWidth
      })
    }, 5000)

    const handleBeforeUnload = (): void => {
      const state = useWorkspaceStore.getState()
      window.electronAPI.saveSession({
        rootPath: state.rootPath,
        openFiles: state.openTabs.map((tab) => ({
          filePath: tab.filePath,
          fileName: tab.fileName
        })),
        activeFilePath: state.activeTabPath,
        sidebarWidth: state.sidebarWidth
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
