import { useMemo } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useWorkspaceStore } from '@/stores/workspace-store'
import {
  BookPlus,
  Eye,
  FileSearch,
  FolderOpen,
  FolderPlus,
  FolderTree,
  LayoutPanelLeft,
  ListTree,
  Pencil,
  Save,
  Settings,
  X
} from 'lucide-react'
import { useCourseStore } from '@/stores/course-store'
import { useLearnerStore } from '@/stores/learner-store'
import {
  persistCourseProjectFilesExpanded,
  useCourseSidebarStore
} from '@/stores/course-sidebar-store'

const isMac = window.electronAPI.platform === 'darwin'
const mod = isMac ? '⌘' : 'Ctrl+'

export function CommandPalette(): React.JSX.Element {
  const open = useWorkspaceStore((s) => s.commandPaletteOpen)
  const setOpen = useWorkspaceStore((s) => s.setCommandPaletteOpen)
  const rootPath = useWorkspaceStore((s) => s.rootPath)
  const activeTabPath = useWorkspaceStore((s) => s.activeTabPath)
  const setWorkspaceSearchOpen = useWorkspaceStore((s) => s.setWorkspaceSearchOpen)
  const toggleOutline = useWorkspaceStore((s) => s.toggleOutline)
  const outlineOpen = useWorkspaceStore((s) => s.outlineOpen)
  const courseStatus = useCourseStore((s) => s.status)
  const manifest = useCourseStore((s) => s.manifest)
  const courseReady = courseStatus === 'ready'
  const learnerActive = useLearnerStore((s) => s.active)

  const canEdit = activeTabPath !== null

  const shortcuts = useMemo(
    () => ({
      save: `${mod}S`,
      close: `${mod}W`,
      openFolder: `${mod}O`,
      workspaceSearch: `${mod}⇧F`,
      toggleSidebar: `${mod}B`,
      toggleOutline: `${mod}⇧O`,
      toggleProjectFiles: `${mod}⇧E`,
      palette: `${mod}⇧P`
    }),
    []
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>Run a command or jump to an action</DialogDescription>
        </DialogHeader>
        <Command className="rounded-none border-0 shadow-none">
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No matching commands</CommandEmpty>
            <CommandGroup heading="File">
              <CommandItem
                disabled={!canEdit}
                onSelect={() => {
                  setOpen(false)
                  window.dispatchEvent(new CustomEvent('md-editor:save-active'))
                }}
              >
                <Save className="text-muted-foreground" />
                <span>Save active file</span>
                <span className="ml-auto text-xs text-muted-foreground">{shortcuts.save}</span>
              </CommandItem>
              <CommandItem
                disabled={!canEdit}
                onSelect={() => {
                  setOpen(false)
                  window.dispatchEvent(new CustomEvent('md-editor:close-active'))
                }}
              >
                <X className="text-muted-foreground" />
                <span>Close active tab</span>
                <span className="ml-auto text-xs text-muted-foreground">{shortcuts.close}</span>
              </CommandItem>
              <CommandItem
                onSelect={async () => {
                  setOpen(false)
                  const result = await window.electronAPI.openFolder()
                  if (result) {
                    useWorkspaceStore.getState().setRootPath(result)
                  }
                }}
              >
                <FolderOpen className="text-muted-foreground" />
                <span>Open folder…</span>
                <span className="ml-auto text-xs text-muted-foreground">{shortcuts.openFolder}</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Workspace">
              <CommandItem
                disabled={!rootPath}
                onSelect={() => {
                  setOpen(false)
                  setWorkspaceSearchOpen(true)
                }}
              >
                <FileSearch className="text-muted-foreground" />
                <span>Search in workspace…</span>
                <span className="ml-auto text-xs text-muted-foreground">{shortcuts.workspaceSearch}</span>
              </CommandItem>
              <CommandItem
                disabled={!rootPath || !courseReady}
                onSelect={() => {
                  setOpen(false)
                  useCourseSidebarStore.getState().toggleProjectFiles()
                  persistCourseProjectFilesExpanded()
                }}
              >
                <FolderTree className="text-muted-foreground" />
                <span>Toggle project files</span>
                <span className="ml-auto text-xs text-muted-foreground">{shortcuts.toggleProjectFiles}</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Course">
              <CommandItem
                onSelect={async () => {
                  setOpen(false)
                  const result = await window.electronAPI.createNewCourseFolder()
                  if (result === null) return
                  if (result.ok) {
                    useWorkspaceStore.getState().setRootPath(result.folderPath)
                  } else {
                    window.alert(result.error)
                  }
                }}
              >
                <BookPlus className="text-muted-foreground" />
                <span>New course…</span>
              </CommandItem>
              <CommandItem
                disabled={!rootPath || courseStatus !== 'no-manifest'}
                onSelect={async () => {
                  if (!rootPath) return
                  setOpen(false)
                  const result = await window.electronAPI.scaffoldCourseInWorkspace(rootPath)
                  if (!result.ok) {
                    window.alert(result.error)
                    return
                  }
                  void useCourseStore.getState().loadForRoot(rootPath)
                }}
              >
                <FolderPlus className="text-muted-foreground" />
                <span>Start course in current folder</span>
              </CommandItem>
              <CommandItem
                disabled={!rootPath || !courseReady}
                onSelect={async () => {
                  if (!rootPath) return
                  setOpen(false)
                  const result = await window.electronAPI.addCourseModule(rootPath)
                  if (!result.ok) {
                    window.alert(result.error)
                    return
                  }
                  void useCourseStore.getState().loadForRoot(rootPath)
                }}
              >
                <FolderPlus className="text-muted-foreground" />
                <span>Add module</span>
              </CommandItem>
              <CommandItem
                disabled={!rootPath || !courseReady}
                onSelect={() => {
                  setOpen(false)
                  if (learnerActive) {
                    useLearnerStore.getState().exit()
                  } else if (manifest && rootPath) {
                    void useLearnerStore.getState().enter(manifest, rootPath)
                  }
                }}
              >
                {learnerActive ? (
                  <Pencil className="text-muted-foreground" />
                ) : (
                  <Eye className="text-muted-foreground" />
                )}
                <span>{learnerActive ? 'Switch to edit mode' : 'Switch to learner mode'}</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="View">
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  requestAnimationFrame(() => {
                    document.querySelector<HTMLButtonElement>('[data-settings-trigger]')?.click()
                  })
                }}
              >
                <Settings className="text-muted-foreground" />
                <span>Settings…</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  window.dispatchEvent(new CustomEvent('md-editor:toggle-sidebar'))
                }}
              >
                <LayoutPanelLeft className="text-muted-foreground" />
                <span>Toggle sidebar</span>
                <span className="ml-auto text-xs text-muted-foreground">{shortcuts.toggleSidebar}</span>
              </CommandItem>
              <CommandItem
                disabled={!canEdit}
                onSelect={() => {
                  setOpen(false)
                  toggleOutline()
                }}
              >
                <ListTree className="text-muted-foreground" />
                <span>{outlineOpen ? 'Hide outline' : 'Show outline'}</span>
                <span className="ml-auto text-xs text-muted-foreground">{shortcuts.toggleOutline}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
