import { BookPlus, Eye, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useCourseStore } from '@/stores/course-store'
import { useLearnerStore } from '@/stores/learner-store'

export function SidebarCourseToolbar(): React.JSX.Element {
  const courseStatus = useCourseStore((s) => s.status)
  const manifest = useCourseStore((s) => s.manifest)
  const rootPath = useWorkspaceStore((s) => s.rootPath)
  const learnerActive = useLearnerStore((s) => s.active)

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

  function handleToggleMode(): void {
    if (learnerActive) {
      useLearnerStore.getState().exit()
    } else if (manifest && rootPath) {
      void useLearnerStore.getState().enter(manifest, rootPath)
    }
  }

  return (
    <>
      {courseStatus === 'ready' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={learnerActive ? 'Switch to edit mode' : 'Switch to learner mode'}
              onClick={handleToggleMode}
            >
              {learnerActive ? (
                <Pencil className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {learnerActive ? 'Edit mode' : 'Learner mode'}
          </TooltipContent>
        </Tooltip>
      )}
      {!learnerActive && (
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
      )}
    </>
  )
}
