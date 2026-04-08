import type { CourseSchema } from './course-manifest'

export interface CourseTemplateLessonDef {
  file: string
  title: string
  body: string
}

export interface CourseTemplateModuleDef {
  folder: string
  title: string
  lessons: CourseTemplateLessonDef[]
}

export interface CourseTemplate {
  name: string
  description: string
  schema: CourseSchema | null
  modules: CourseTemplateModuleDef[]
}

export interface CourseTemplateMeta {
  /** Filename without .yaml extension */
  id: string
  name: string
  description: string
  /** true for shipped defaults, false for user-created */
  builtIn: boolean
}
