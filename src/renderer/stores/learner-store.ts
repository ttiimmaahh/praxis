import { create } from 'zustand'
import type { CourseManifestParsed } from '@shared/course-manifest'

export interface FlatLesson {
  moduleIndex: number
  lessonIndex: number
  modulePath: string
  moduleTitle: string
  lessonPath: string
  lessonTitle: string
  /** Unique key: "modulePath/lessonPath" */
  key: string
}

interface LearnerState {
  /** Whether the learner view is active. */
  active: boolean
  /** Flattened ordered list of all lessons. */
  flatLessons: FlatLesson[]
  /** Index into flatLessons for the current lesson. */
  currentIndex: number
  /** Set of completed lesson keys ("modulePath/lessonPath"). */
  completedKeys: Set<string>
  /** The course root path this progress belongs to. */
  courseRoot: string | null

  enter: (manifest: CourseManifestParsed, courseRoot: string) => Promise<void>
  exit: () => void
  goTo: (index: number) => void
  goNext: () => void
  goPrev: () => void
  toggleComplete: (key: string) => Promise<void>
}

function flattenManifest(manifest: CourseManifestParsed): FlatLesson[] {
  const result: FlatLesson[] = []
  manifest.modules.forEach((mod, mi) => {
    mod.lessons.forEach((lesson, li) => {
      result.push({
        moduleIndex: mi,
        lessonIndex: li,
        modulePath: mod.path,
        moduleTitle: mod.title ?? mod.path,
        lessonPath: lesson.path,
        lessonTitle: lesson.title ?? lesson.path.replace(/\.md$/i, ''),
        key: `${mod.path}/${lesson.path}`
      })
    })
  })
  return result
}

export const useLearnerStore = create<LearnerState>()((set, get) => ({
  active: false,
  flatLessons: [],
  currentIndex: 0,
  completedKeys: new Set(),
  courseRoot: null,

  enter: async (manifest, courseRoot) => {
    const flatLessons = flattenManifest(manifest)
    const progress = await window.electronAPI.getCourseProgress(courseRoot)
    set({
      active: true,
      flatLessons,
      currentIndex: 0,
      completedKeys: new Set(progress.completedLessons),
      courseRoot
    })
  },

  exit: () => {
    set({ active: false, currentIndex: 0 })
  },

  goTo: (index) => {
    const { flatLessons } = get()
    if (index >= 0 && index < flatLessons.length) {
      set({ currentIndex: index })
    }
  },

  goNext: () => {
    const { currentIndex, flatLessons } = get()
    if (currentIndex < flatLessons.length - 1) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  goPrev: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 })
    }
  },

  toggleComplete: async (key) => {
    const { completedKeys, courseRoot, flatLessons } = get()
    if (!courseRoot) return
    const lesson = flatLessons.find((l) => l.key === key)
    if (!lesson) return

    const isCompleted = completedKeys.has(key)
    const next = new Set(completedKeys)
    if (isCompleted) {
      next.delete(key)
      await window.electronAPI.unmarkLessonComplete(courseRoot, lesson.modulePath, lesson.lessonPath)
    } else {
      next.add(key)
      await window.electronAPI.markLessonComplete(courseRoot, lesson.modulePath, lesson.lessonPath)
    }
    set({ completedKeys: next })
  }
}))
