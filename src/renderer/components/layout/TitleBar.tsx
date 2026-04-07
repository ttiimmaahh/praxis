import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/stores/workspace-store'

export function TitleBar(): React.JSX.Element {
  const rootPath = useWorkspaceStore((s) => s.rootPath)

  async function handleOpenFolder(): Promise<void> {
    const result = await window.electronAPI.openFolder()
    if (result) {
      useWorkspaceStore.getState().setRootPath(result)
    }
  }

  const folderName = rootPath ? rootPath.split('/').pop() ?? rootPath : null

  return (
    <div className="flex h-12 shrink-0 items-center border-b border-border bg-background/80 backdrop-blur-sm">
      {/* macOS traffic light spacing */}
      <div className="w-20 shrink-0 app-drag-region" />

      <div className="flex flex-1 items-center gap-2 app-drag-region">
        <span className="text-sm font-medium text-muted-foreground select-none">
          {folderName ?? 'md-editor'}
        </span>
      </div>

      <div className="flex items-center gap-1 px-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpenFolder}>
          <FolderOpen className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
