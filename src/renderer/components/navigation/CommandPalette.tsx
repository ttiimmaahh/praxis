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
import { FileSearch, FolderOpen, LayoutPanelLeft, ListTree, Save, X } from 'lucide-react'

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

  const canEdit = activeTabPath !== null

  const shortcuts = useMemo(
    () => ({
      save: `${mod}S`,
      close: `${mod}W`,
      openFolder: `${mod}O`,
      workspaceSearch: `${mod}⇧F`,
      toggleSidebar: `${mod}B`,
      toggleOutline: `${mod}⇧O`,
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
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="View">
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
