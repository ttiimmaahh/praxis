import { ChevronDown, FolderTree } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { FileTree } from '@/components/file-tree/FileTree'
import { cn } from '@/lib/utils'
import {
  persistCourseProjectFilesExpanded,
  useCourseSidebarStore
} from '@/stores/course-sidebar-store'

export function ProjectFilesSection(): React.JSX.Element {
  const open = useCourseSidebarStore((s) => s.projectFilesOpen)

  return (
    <div className="border-b border-border/60 px-2 py-2">
      <Collapsible
        open={open}
        onOpenChange={(next) => {
          useCourseSidebarStore.getState().setProjectFilesOpen(next)
          persistCourseProjectFilesExpanded()
        }}
      >
        <CollapsibleTrigger
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium text-sidebar-foreground',
            'outline-none hover:bg-sidebar-accent/50 focus-visible:ring-2 focus-visible:ring-ring',
            '[&[data-state=open]>svg:first-of-type]:rotate-180'
          )}
        >
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform" />
          <FolderTree className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">Project files</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=closed]:animate-none">
          <div className="pb-2">
            <FileTree />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
