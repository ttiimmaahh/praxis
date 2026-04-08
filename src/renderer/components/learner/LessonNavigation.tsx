import { ChevronLeft, ChevronRight, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLearnerStore, type FlatLesson } from '@/stores/learner-store'

export function LessonNavigation(): React.JSX.Element {
  const currentIndex = useLearnerStore((s) => s.currentIndex)
  const flatLessons = useLearnerStore((s) => s.flatLessons)
  const completedKeys = useLearnerStore((s) => s.completedKeys)
  const goNext = useLearnerStore((s) => s.goNext)
  const goPrev = useLearnerStore((s) => s.goPrev)
  const toggleComplete = useLearnerStore((s) => s.toggleComplete)

  const current = flatLessons[currentIndex] as FlatLesson | undefined
  const prev = currentIndex > 0 ? flatLessons[currentIndex - 1] : null
  const next = currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null
  const isComplete = current ? completedKeys.has(current.key) : false

  return (
    <div className="flex items-center justify-between border-t border-border/50 bg-muted/30 px-6 py-3">
      <div className="flex min-w-0 flex-1">
        {prev ? (
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={goPrev}>
            <ChevronLeft className="size-4" />
            <span className="max-w-[200px] truncate">{prev.lessonTitle}</span>
          </Button>
        ) : (
          <div />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {current && (
          <Button
            variant={isComplete ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => void toggleComplete(current.key)}
          >
            <CircleCheck className="size-4" />
            {isComplete ? 'Completed' : 'Mark complete'}
          </Button>
        )}
      </div>

      <div className="flex min-w-0 flex-1 justify-end">
        {next ? (
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={goNext}>
            <span className="max-w-[200px] truncate">{next.lessonTitle}</span>
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}
