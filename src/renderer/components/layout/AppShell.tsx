import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileTree } from '@/components/file-tree/FileTree'
import { CoursePanel } from '@/components/course/CoursePanel'
import { ProjectFilesSection } from '@/components/course/ProjectFilesSection'
import { SidebarCourseToolbar } from '@/components/course/SidebarCourseToolbar'
import { useCourseStore } from '@/stores/course-store'
import { EditorArea } from './EditorArea'
import { KeyboardNavigationLayer } from './KeyboardNavigationLayer'
import { CommandPalette } from '@/components/navigation/CommandPalette'
import { WorkspaceSearchDialog } from '@/components/navigation/WorkspaceSearchDialog'
import { basenameFromPath } from '@/lib/path-utils'
import { AppearanceMenu } from '@/components/settings/AppearanceMenu'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useSidebarResize } from '@/hooks/use-sidebar-resize'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const isMac = window.electronAPI.platform === 'darwin'

function SidebarExplorer(): React.JSX.Element {
  const rootPath = useWorkspaceStore((s) => s.rootPath)
  const courseStatus = useCourseStore((s) => s.status)
  const courseReady = courseStatus === 'ready'

  async function handleOpenFolder(): Promise<void> {
    const result = await window.electronAPI.openFolder()
    if (result) {
      useWorkspaceStore.getState().setRootPath(result)
    }
  }

  async function handleScaffoldInCurrentFolder(): Promise<void> {
    if (!rootPath) return
    const result = await window.electronAPI.scaffoldCourseInWorkspace(rootPath)
    if (!result.ok) {
      window.alert(result.error)
      return
    }
    void useCourseStore.getState().loadForRoot(rootPath)
  }

  return (
    <>
      <SidebarHeader className="flex h-[38px] flex-row items-center justify-end gap-1 border-b border-border/40 px-2 py-0 app-drag-region">
        <div className="pointer-events-auto flex items-center gap-0.5 no-drag">
          <SidebarCourseToolbar />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full min-w-0">
          {rootPath ? (
            <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col">
              {courseStatus === 'no-manifest' ? (
                <div className="border-b border-border/60 px-2 py-2">
                  <p className="mb-2 text-[11px] leading-snug text-muted-foreground">
                    No course.yaml in this folder. Create a manifest and a starter module to begin.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => void handleScaffoldInCurrentFolder()}
                  >
                    Start course in this folder
                  </Button>
                </div>
              ) : null}
              <CoursePanel />
              {courseReady ? <ProjectFilesSection /> : <FileTree />}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <span className="text-[13px] font-medium text-sidebar-foreground/70">
                No folder open
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-sidebar-foreground/70"
                onClick={handleOpenFolder}
              >
                <FolderOpen />
                Open Folder
              </Button>
            </div>
          )}
        </ScrollArea>
      </SidebarContent>
    </>
  )
}

function TitleBarInset(): React.JSX.Element {
  const rootPath = useWorkspaceStore((s) => s.rootPath)
  const folderName = rootPath ? basenameFromPath(rootPath) : null
  const { state } = useSidebar()
  const sidebarCollapsed = state === 'collapsed'

  return (
    <header
      className={cn(
        'flex h-[38px] shrink-0 items-center gap-2 border-b border-border/50 px-3 app-drag-region transition-[padding] duration-200',
        isMac && sidebarCollapsed && 'pl-[80px]',
        !isMac && 'pr-[140px]'
      )}
    >
      <SidebarTrigger className="-ml-1 text-muted-foreground/60 hover:text-foreground" />
      <Separator orientation="vertical" className="mr-1 !h-4 bg-border/40" />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground/60 select-none">
        {folderName ?? 'md-editor'}
      </span>
      <AppearanceMenu />
    </header>
  )
}

function SidebarResizeHandle(): React.JSX.Element {
  const { toggleSidebar, state } = useSidebar()
  const sidebarWidth = useWorkspaceStore((s) => s.sidebarWidth)

  const { dragRef, handleMouseDown } = useSidebarResize({
    currentWidth: sidebarWidth,
    onResize: (width) => useWorkspaceStore.getState().setSidebarWidth(width),
    onToggle: toggleSidebar,
    isCollapsed: state === 'collapsed'
  })

  return (
    <button
      ref={dragRef}
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Resize Sidebar"
      tabIndex={-1}
      onMouseDown={handleMouseDown}
      className={cn(
        'absolute inset-y-0 z-20 flex w-4 cursor-col-resize items-center justify-center group-data-[side=left]:-right-4 ltr:-translate-x-1/2 rtl:-translate-x-1/2',
        'after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] hover:after:bg-sidebar-border',
        'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar',
        '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
        state === 'collapsed' && 'cursor-e-resize'
      )}
    />
  )
}

export function AppShell(): React.JSX.Element {
  const sidebarWidth = useWorkspaceStore((s) => s.sidebarWidth)

  return (
    <SidebarProvider
      className="h-dvh min-h-0 overflow-hidden"
      style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
    >
      <KeyboardNavigationLayer />
      <CommandPalette />
      <WorkspaceSearchDialog />
      <Sidebar variant="inset" className="border-r-0">
        <SidebarExplorer />
        <SidebarResizeHandle />
      </Sidebar>
      <SidebarInset className="min-h-0 ring-0 peer-data-[variant=inset]:shadow-none">
        <TitleBarInset />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EditorArea />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
