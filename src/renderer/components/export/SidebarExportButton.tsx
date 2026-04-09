import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useCourseStore } from '@/stores/course-store'
import { useLearnerStore } from '@/stores/learner-store'
import { exportActiveCourseAs, exportActiveDocumentAs } from '@/lib/export/export-actions'

/**
 * Sidebar-header dropdown button that groups all export entry points in one
 * place. Styling intentionally mirrors `SidebarCourseToolbar`'s BookPlus button
 * (ghost / size-icon / h-8 w-8) so the two sit side-by-side cleanly.
 *
 * "Active document" is mode-aware: in editor mode it's the active workspace tab,
 * in learner mode it's the lesson currently open in the reader. Without this
 * reconciliation, learner mode would see a stale (or missing) `activeTabPath`
 * from the workspace store and disable the Document entries incorrectly.
 */
export function SidebarExportButton(): React.JSX.Element {
  const activeTabPath = useWorkspaceStore((s) => s.activeTabPath)
  const courseStatus = useCourseStore((s) => s.status)
  const courseReady = courseStatus === 'ready'

  const learnerActive = useLearnerStore((s) => s.active)
  const learnerHasLesson = useLearnerStore(
    (s) => s.active && s.flatLessons.length > 0 && !!s.flatLessons[s.currentIndex]
  )
  const hasActiveDocument = learnerActive ? learnerHasLesson : !!activeTabPath

  const hasNothingToExport = !hasActiveDocument && !courseReady

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Export"
              disabled={hasNothingToExport}
            >
              <Download className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Export…</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Document
        </DropdownMenuLabel>
        <DropdownMenuItem
          disabled={!hasActiveDocument}
          onSelect={() => void exportActiveDocumentAs('html')}
        >
          Export as HTML
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!hasActiveDocument}
          onSelect={() => void exportActiveDocumentAs('pdf')}
        >
          Export as PDF
        </DropdownMenuItem>
        {courseReady && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Course
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => void exportActiveCourseAs('html')}>
              Export course as HTML
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void exportActiveCourseAs('pdf')}>
              Export course as PDF
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
