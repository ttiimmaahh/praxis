import { JsonStore } from './json-store'

/**
 * Per-course progress: a set of completed lesson keys.
 * Lesson keys are "modulePath/lessonPath" (e.g. "01-intro/welcome.md").
 */
export interface CourseProgress {
  completedLessons: string[]
}

interface ProgressData {
  /** Keyed by course root absolute path. */
  courses: Record<string, CourseProgress>
}

let store: JsonStore<{ progress: ProgressData }>

function getStore(): JsonStore<{ progress: ProgressData }> {
  if (!store) {
    store = new JsonStore({
      fileName: 'progress.json',
      defaults: { progress: { courses: {} } }
    })
  }
  return store
}

function lessonKey(modulePath: string, lessonPath: string): string {
  return `${modulePath}/${lessonPath}`
}

export function getCourseProgress(courseRoot: string): CourseProgress {
  const all = getStore().get('progress')
  return all.courses[courseRoot] ?? { completedLessons: [] }
}

export function markLessonComplete(
  courseRoot: string,
  modulePath: string,
  lessonPath: string
): CourseProgress {
  const all = getStore().get('progress')
  const course = all.courses[courseRoot] ?? { completedLessons: [] }
  const key = lessonKey(modulePath, lessonPath)
  if (!course.completedLessons.includes(key)) {
    course.completedLessons.push(key)
  }
  all.courses[courseRoot] = course
  getStore().set('progress', all)
  return course
}

export function unmarkLessonComplete(
  courseRoot: string,
  modulePath: string,
  lessonPath: string
): CourseProgress {
  const all = getStore().get('progress')
  const course = all.courses[courseRoot] ?? { completedLessons: [] }
  const key = lessonKey(modulePath, lessonPath)
  course.completedLessons = course.completedLessons.filter((k) => k !== key)
  all.courses[courseRoot] = course
  getStore().set('progress', all)
  return course
}
