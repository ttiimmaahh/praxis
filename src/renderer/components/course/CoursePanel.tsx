import { BookOpen, ChevronDown, FilePlus, FolderPlus } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar'
import {
  joinWorkspacePath,
  basenameFromPath,
  sidebarLabelFromLessonPath
} from '@/lib/path-utils'
import { useCourseStore } from '@/stores/course-store'
import { useWorkspaceStore } from '@/stores/workspace-store'

export function CoursePanel(): React.JSX.Element | null {
  const rootPath = useWorkspaceStore((s) => s.rootPath)
  const openFile = useWorkspaceStore((s) => s.openFile)
  const status = useCourseStore((s) => s.status)
  const manifest = useCourseStore((s) => s.manifest)
  const errors = useCourseStore((s) => s.errors)
  const warnings = useCourseStore((s) => s.warnings)
  const loadCourseForRoot = useCourseStore((s) => s.loadForRoot)

  async function handleAddModule(): Promise<void> {
    if (!rootPath) return
    const result = await window.electronAPI.addCourseModule(rootPath)
    if (!result.ok) {
      window.alert(result.error)
      return
    }
    void loadCourseForRoot(rootPath)
  }

  async function handleAddLesson(modulePath: string): Promise<void> {
    if (!rootPath) return
    const result = await window.electronAPI.addCourseLesson(rootPath, modulePath)
    if (!result.ok) {
      window.alert(result.error)
      return
    }
    void loadCourseForRoot(rootPath)
  }

  if (!rootPath || status === 'idle' || status === 'loading' || status === 'no-manifest') {
    return null
  }

  if (status === 'invalid') {
    return (
      <div className="border-b border-border/60 px-2 py-2">
        <Alert variant="destructive">
          <AlertTitle>Invalid course manifest</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-inside list-disc gap-1 text-pretty">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!manifest) {
    return null
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-2 border-b border-border/60 px-2 py-2">
      {warnings.length > 0 ? (
        <Alert>
          <AlertTitle>Course manifest warnings</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-inside list-disc gap-1 text-pretty">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

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
            <SidebarMenuAction
              type="button"
              title="Add module"
              aria-label="Add module"
              className="top-1.5 right-1 h-8 w-8 [&>svg]:size-4"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void handleAddModule()
              }}
            >
              <FolderPlus strokeWidth={2} />
              <span className="sr-only">Add module</span>
            </SidebarMenuAction>
            <CollapsibleContent className="data-[state=closed]:animate-none">
              <SidebarMenu className="mt-1 gap-3 border-0 p-0">
                {manifest.modules.map((mod, modIndex) => (
                  <SidebarMenuItem key={`${modIndex}-${mod.path}`}>
                    <SidebarMenuButton
                      type="button"
                      size="sm"
                      className="h-auto min-h-7 cursor-default rounded-md py-1 text-left text-[11px] font-medium tracking-wide text-muted-foreground uppercase hover:bg-transparent"
                      tabIndex={-1}
                    >
                      <span>{mod.title ?? mod.path}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      type="button"
                      title="Add lesson"
                      aria-label={`Add lesson to ${mod.title ?? mod.path}`}
                      className="top-1 right-1 h-8 w-8 [&>svg]:size-4"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        void handleAddLesson(mod.path)
                      }}
                    >
                      <FilePlus strokeWidth={2} />
                      <span className="sr-only">Add lesson</span>
                    </SidebarMenuAction>
                    <SidebarMenuSub className="mx-0 border-0 px-0">
                      {mod.lessons.map((lesson, lessonIndex) => {
                        const fullPath = joinWorkspacePath(rootPath, mod.path, lesson.path)
                        const fileName = basenameFromPath(fullPath)
                        const label =
                          lesson.title ?? sidebarLabelFromLessonPath(lesson.path)
                        return (
                          <SidebarMenuSubItem
                            key={`${modIndex}-${lessonIndex}-${lesson.path}`}
                          >
                            <SidebarMenuSubButton asChild size="sm" className="rounded-md">
                              <button
                                type="button"
                                title={label}
                                onClick={() => openFile(fullPath, fileName)}
                              >
                                <span>{label}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </div>
  )
}
