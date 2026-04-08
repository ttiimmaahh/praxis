import { CheckCircle2, Circle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useLearnerStore } from '@/stores/learner-store'
import { useCourseStore } from '@/stores/course-store'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { BookOpen, ChevronDown } from 'lucide-react'

export function LearnerOutline(): React.JSX.Element | null {
  const manifest = useCourseStore((s) => s.manifest)
  const flatLessons = useLearnerStore((s) => s.flatLessons)
  const currentIndex = useLearnerStore((s) => s.currentIndex)
  const completedKeys = useLearnerStore((s) => s.completedKeys)
  const goTo = useLearnerStore((s) => s.goTo)

  if (!manifest) return null

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-2 px-2 py-2">
      <SidebarMenu>
        <Collapsible asChild defaultOpen className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton size="sm" className="rounded-md text-[13px] font-medium">
                <ChevronDown className="text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                <BookOpen className="text-muted-foreground" />
                <span>{manifest.title}</span>
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent className="data-[state=closed]:animate-none">
              <SidebarMenu className="mt-1 gap-3 border-0 p-0">
                {manifest.modules.map((mod, mi) => {
                  const moduleLessons = flatLessons.filter((l) => l.moduleIndex === mi)
                  const completedCount = moduleLessons.filter((l) =>
                    completedKeys.has(l.key)
                  ).length
                  const totalCount = moduleLessons.length
                  const progressPercent =
                    totalCount > 0 ? (completedCount / totalCount) * 100 : 0

                  return (
                    <SidebarMenuItem key={`${mi}-${mod.path}`}>
                      <SidebarMenuButton
                        type="button"
                        size="sm"
                        className="h-auto min-h-7 cursor-default rounded-md py-1 text-left text-[11px] font-medium tracking-wide text-muted-foreground uppercase hover:bg-transparent"
                        tabIndex={-1}
                      >
                        <span>{mod.title ?? mod.path}</span>
                      </SidebarMenuButton>
                      <div className="flex items-center gap-2 px-2 pb-1">
                        <Progress value={progressPercent} className="h-1.5 flex-1" />
                        <span className="text-[10px] tabular-nums text-muted-foreground/70">
                          {completedCount}/{totalCount}
                        </span>
                      </div>
                      <SidebarMenuSub className="mx-0 border-0 px-0">
                        {moduleLessons.map((lesson) => {
                          const flatIndex = flatLessons.indexOf(lesson)
                          const isCurrent = flatIndex === currentIndex
                          const isCompleted = completedKeys.has(lesson.key)

                          return (
                            <SidebarMenuSubItem key={lesson.key}>
                              <SidebarMenuSubButton
                                asChild
                                size="sm"
                                isActive={isCurrent}
                                className="rounded-md"
                              >
                                <button
                                  type="button"
                                  title={lesson.lessonTitle}
                                  onClick={() => goTo(flatIndex)}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                                  ) : (
                                    <Circle className="size-4 shrink-0 text-muted-foreground/40" />
                                  )}
                                  <span>{lesson.lessonTitle}</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </div>
  )
}
