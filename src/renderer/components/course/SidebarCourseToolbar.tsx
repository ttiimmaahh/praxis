import { BookPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useWorkspaceStore } from '@/stores/workspace-store'

export function SidebarCourseToolbar(): React.JSX.Element {
  async function handleNewCourse(): Promise<void> {
    const result = await window.electronAPI.createNewCourseFolder()
    if (result === null) {
      return
    }
    if (result.ok) {
      useWorkspaceStore.getState().setRootPath(result.folderPath)
      return
    }
    window.alert(result.error)
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="New course"
          onClick={() => void handleNewCourse()}
        >
          <BookPlus className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">New course…</TooltipContent>
    </Tooltip>
  )
}
