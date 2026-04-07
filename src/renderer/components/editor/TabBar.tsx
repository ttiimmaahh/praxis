import { X } from 'lucide-react'
import { useWorkspaceStore, type FileTab } from '@/stores/workspace-store'
import { cn } from '@/lib/utils'

export function TabBar(): React.JSX.Element {
  const openTabs = useWorkspaceStore((s) => s.openTabs)
  const activeTabPath = useWorkspaceStore((s) => s.activeTabPath)
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab)
  const closeFile = useWorkspaceStore((s) => s.closeFile)

  if (openTabs.length === 0) return <></>

  return (
    <div className="flex h-9 shrink-0 items-center overflow-x-auto border-b border-border bg-muted/30">
      {openTabs.map((tab: FileTab) => (
        <button
          key={tab.filePath}
          type="button"
          className={cn(
            'group flex h-full items-center gap-1.5 border-r border-border px-3 text-xs transition-colors',
            tab.filePath === activeTabPath
              ? 'bg-background text-foreground'
              : 'text-muted-foreground hover:bg-accent/30'
          )}
          onClick={() => setActiveTab(tab.filePath)}
        >
          <span className="max-w-32 truncate">
            {tab.isDirty && <span className="mr-0.5 text-muted-foreground">&#9679;</span>}
            {tab.fileName}
          </span>
          <span
            role="button"
            tabIndex={0}
            className="ml-1 rounded-sm p-0.5 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              closeFile(tab.filePath)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation()
                closeFile(tab.filePath)
              }
            }}
          >
            <X className="h-3 w-3" />
          </span>
        </button>
      ))}
    </div>
  )
}
