import { useEffect } from 'react'
import { useSidebar } from '@/components/ui/sidebar'
import { useWorkspaceStore } from '@/stores/workspace-store'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function KeyboardNavigationLayer(): React.JSX.Element {
  const { toggleSidebar } = useSidebar()
  const setCommandPaletteOpen = useWorkspaceStore((s) => s.setCommandPaletteOpen)
  const setWorkspaceSearchOpen = useWorkspaceStore((s) => s.setWorkspaceSearchOpen)
  const toggleOutline = useWorkspaceStore((s) => s.toggleOutline)
  const commandPaletteOpen = useWorkspaceStore((s) => s.commandPaletteOpen)
  const workspaceSearchOpen = useWorkspaceStore((s) => s.workspaceSearchOpen)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (commandPaletteOpen || workspaceSearchOpen) return

      const mod = event.metaKey || event.ctrlKey
      if (!mod) return

      const key = event.key.toLowerCase()

      if (key === 'b') {
        if (isEditableTarget(event.target)) return
        event.preventDefault()
        toggleSidebar()
        return
      }

      if (key === 'p' && event.shiftKey) {
        event.preventDefault()
        setCommandPaletteOpen(true)
        return
      }

      if (key === 'f' && event.shiftKey) {
        event.preventDefault()
        setWorkspaceSearchOpen(true)
        return
      }

      if (key === 'o' && event.shiftKey) {
        event.preventDefault()
        toggleOutline()
        return
      }

      if (key === 'o' && !event.shiftKey) {
        if (isEditableTarget(event.target)) return
        event.preventDefault()
        void (async () => {
          const result = await window.electronAPI.openFolder()
          if (result) {
            useWorkspaceStore.getState().setRootPath(result)
          }
        })()
      }
    }

    const onToggleSidebarEvent = (): void => {
      toggleSidebar()
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('md-editor:toggle-sidebar', onToggleSidebarEvent)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('md-editor:toggle-sidebar', onToggleSidebarEvent)
    }
  }, [
    commandPaletteOpen,
    workspaceSearchOpen,
    setCommandPaletteOpen,
    setWorkspaceSearchOpen,
    toggleOutline,
    toggleSidebar
  ])

  return <></>
}
