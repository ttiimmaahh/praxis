import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileTree } from '@/components/file-tree/FileTree'
import { EditorArea } from './EditorArea'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function SidebarExplorer(): React.JSX.Element {
  const rootPath = useWorkspaceStore((s) => s.rootPath)

  async function handleOpenFolder(): Promise<void> {
    const result = await window.electronAPI.openFolder()
    if (result) {
      useWorkspaceStore.getState().setRootPath(result)
    }
  }

  return (
    <>
      <SidebarHeader className="h-[52px] justify-center border-b border-sidebar-border px-3">
        <div className="flex items-center justify-between">
          <span className="truncate text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
            Explorer
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                onClick={handleOpenFolder}
              >
                <FolderOpen className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Open Folder</TooltipContent>
          </Tooltip>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          {rootPath ? (
            <FileTree />
          ) : (
            <div className="flex flex-col gap-1 px-3 py-6">
              <span className="text-[13px] text-sidebar-foreground/70">No folder open</span>
              <span className="text-[11px] leading-relaxed text-sidebar-foreground/40">
                Press the folder button or use the menu to open a project
              </span>
            </div>
          )}
        </ScrollArea>
      </SidebarContent>
    </>
  )
}

function TitleBarInset(): React.JSX.Element {
  const rootPath = useWorkspaceStore((s) => s.rootPath)
  const folderName = rootPath ? rootPath.split('/').pop() ?? rootPath : null

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-border/50 px-4 app-drag-region">
      <SidebarTrigger className="-ml-1 h-7 w-7 text-muted-foreground/60 hover:text-foreground" />
      <Separator orientation="vertical" className="mr-1 !h-4 bg-border/40" />
      <span className="text-[13px] font-medium text-foreground/60 select-none">
        {folderName ?? 'md-editor'}
      </span>
    </header>
  )
}

export function AppShell(): React.JSX.Element {
  return (
    <SidebarProvider>
      <Sidebar className="border-r-0">
        <SidebarExplorer />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <TitleBarInset />
        <div className="flex-1 overflow-hidden">
          <EditorArea />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
