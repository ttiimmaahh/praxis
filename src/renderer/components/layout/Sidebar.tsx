import { useWorkspaceStore } from '@/stores/workspace-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileTree } from '@/components/file-tree/FileTree'

export function Sidebar(): React.JSX.Element {
  const rootPath = useWorkspaceStore((s) => s.rootPath)

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-10 shrink-0 items-center px-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Explorer
        </span>
      </div>
      <ScrollArea className="flex-1">
        {rootPath ? (
          <FileTree />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <span className="text-sm text-muted-foreground">No folder open</span>
            <span className="text-xs text-muted-foreground/60">
              Use the toolbar button to open a folder
            </span>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
