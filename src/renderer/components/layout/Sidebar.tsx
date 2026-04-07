import { useWorkspaceStore } from '@/stores/workspace-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileTree } from '@/components/file-tree/FileTree'

export function Sidebar(): React.JSX.Element {
  const rootPath = useWorkspaceStore((s) => s.rootPath)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className="flex h-10 shrink-0 items-center px-3">
        <span className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Explorer
        </span>
      </div>
      <ScrollArea className="flex-1">
        {rootPath ? (
          <FileTree />
        ) : (
          <div className="flex flex-col gap-1 px-3 py-8">
            <span className="text-sm text-muted-foreground">No folder open</span>
            <span className="text-xs leading-relaxed text-muted-foreground/60">
              Use the folder button in the title bar to open a project
            </span>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
