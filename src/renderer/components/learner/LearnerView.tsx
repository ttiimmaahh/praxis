import { useEffect, useState } from 'react'
import { useLearnerStore } from '@/stores/learner-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { joinWorkspacePath } from '@/lib/path-utils'
import { LessonReader } from './LessonReader'
import { LessonNavigation } from './LessonNavigation'

function stripFrontmatter(content: string): string {
  const text = content.replace(/^\uFEFF/, '')
  if (!text.startsWith('---')) return content
  const end = text.indexOf('\n---', 3)
  if (end === -1) return content
  return text.slice(end + 4)
}

export function LearnerView(): React.JSX.Element {
  const rootPath = useWorkspaceStore((s) => s.rootPath)
  const flatLessons = useLearnerStore((s) => s.flatLessons)
  const currentIndex = useLearnerStore((s) => s.currentIndex)
  const current = flatLessons[currentIndex]

  const [lessonContent, setLessonContent] = useState<string | null>(null)
  const [loadingLesson, setLoadingLesson] = useState(false)

  useEffect(() => {
    if (!rootPath || !current) {
      setLessonContent(null)
      return
    }
    const fullPath = joinWorkspacePath(rootPath, current.modulePath, current.lessonPath)
    let cancelled = false
    setLoadingLesson(true)
    window.electronAPI
      .readFile(fullPath)
      .then((content) => {
        if (!cancelled) setLessonContent(stripFrontmatter(content))
      })
      .catch(() => {
        if (!cancelled) setLessonContent('> **Error**: Could not load this lesson file.')
      })
      .finally(() => {
        if (!cancelled) setLoadingLesson(false)
      })
    return () => {
      cancelled = true
    }
  }, [rootPath, current?.key])

  if (flatLessons.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <span className="text-lg font-medium">No lessons found</span>
        <span className="text-sm text-muted-foreground/60">
          This course has no lessons to display
        </span>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      {current && (
        <div className="flex h-8 shrink-0 items-center justify-between border-b border-border/50 bg-muted/20 px-3">
          <span className="text-[11px] text-muted-foreground">
            {current.moduleTitle}
            <span className="mx-1.5 text-muted-foreground/40">/</span>
            {current.lessonTitle}
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground/60">
            {currentIndex + 1} of {flatLessons.length}
          </span>
        </div>
      )}
      <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [touch-action:pan-y]">
        {loadingLesson ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading lesson...
          </div>
        ) : lessonContent !== null ? (
          <div className="px-4 py-4">
            <LessonReader key={current?.key} content={lessonContent} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a lesson to begin
          </div>
        )}
      </div>
      <LessonNavigation />
    </div>
  )
}
