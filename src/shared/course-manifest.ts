/**
 * `course.yaml` at the workspace root. Paths use POSIX-style segments; each module
 * is a folder under the course root; each lesson path is relative to that folder.
 *
 * @example
 * ```yaml
 * title: My Course
 * modules:
 *   - path: 01-intro
 *     title: Introduction
 *     lessons:
 *       - welcome.md
 *       - path: deep/lesson.md
 *         title: "Display name with & ampersand"
 * ```
 *
 * Use double quotes for any string that contains `&` (YAML reserves `&` and `*` for anchors/aliases).
 */
export interface CourseLessonRef {
  /** Markdown file path relative to the module folder. */
  path: string
  /**
   * Sidebar label. If omitted in `course.yaml`, the main process fills this from the lesson
   * file: frontmatter `title`, else the first `#` heading, else a humanized basename.
   */
  title?: string
}

export interface CourseModuleManifest {
  /** Folder name or path relative to course root (no `..`). */
  path: string
  /** Optional label for UI. */
  title?: string
  /**
   * Each entry is either a filename string or `{ path, title? }` for a custom label.
   */
  lessons: CourseLessonRef[]
}

export interface SchemaField {
  name: string
  required: boolean
  type: 'string' | 'number'
}

export interface CourseSchema {
  lessonFields: SchemaField[]
}

export interface CourseManifestParsed {
  title: string
  modules: CourseModuleManifest[]
  schema?: CourseSchema
}

/** Result of reading and validating `course.yaml` on disk (main process). */
export type LoadCourseManifestResult =
  | { status: 'no-manifest' }
  | { status: 'invalid'; errors: string[] }
  | { status: 'ok'; manifest: CourseManifestParsed; warnings: string[] }

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** Reject `..` and empty segments in a path string. */
function isSafeRelativePath(value: string): boolean {
  const segments = value.split(/[/\\]/).filter((s) => s.length > 0)
  return segments.length > 0 && segments.every((s) => s !== '..')
}

export function validateCourseManifestStructure(
  data: unknown
): { ok: true; manifest: CourseManifestParsed } | { ok: false; errors: string[] } {
  const errors: string[] = []

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, errors: ['Manifest must be a YAML object at the root.'] }
  }

  const root = data as Record<string, unknown>

  if (!isNonEmptyString(root.title)) {
    errors.push('Field `title` must be a non-empty string.')
  }

  if (!Array.isArray(root.modules)) {
    errors.push('Field `modules` must be an array.')
  } else if (root.modules.length === 0) {
    errors.push('Field `modules` must contain at least one module.')
  } else {
    root.modules.forEach((mod, i) => {
      if (mod === null || typeof mod !== 'object' || Array.isArray(mod)) {
        errors.push(`modules[${i}]: must be an object.`)
        return
      }
      const m = mod as Record<string, unknown>
      if (!isNonEmptyString(m.path)) {
        errors.push(`modules[${i}].path must be a non-empty string.`)
      } else if (!isSafeRelativePath(m.path.trim())) {
        errors.push(`modules[${i}].path must be a safe relative path (no "..").`)
      }
      if (m.title !== undefined && m.title !== null) {
        if (typeof m.title !== 'string') {
          errors.push(`modules[${i}].title must be a string when set.`)
        }
      }
      if (!Array.isArray(m.lessons)) {
        errors.push(`modules[${i}].lessons must be an array.`)
      } else if (m.lessons.length === 0) {
        errors.push(`modules[${i}].lessons must list at least one lesson.`)
      } else {
        m.lessons.forEach((lesson, j) => {
          if (isNonEmptyString(lesson)) {
            if (!isSafeRelativePath(lesson.trim())) {
              errors.push(`modules[${i}].lessons[${j}] must be a safe relative path (no "..").`)
            }
            return
          }
          if (lesson === null || typeof lesson !== 'object' || Array.isArray(lesson)) {
            errors.push(
              `modules[${i}].lessons[${j}] must be a string or an object with a "path" field.`
            )
            return
          }
          const lo = lesson as Record<string, unknown>
          if (!isNonEmptyString(lo.path)) {
            errors.push(`modules[${i}].lessons[${j}].path must be a non-empty string.`)
          } else if (!isSafeRelativePath((lo.path as string).trim())) {
            errors.push(`modules[${i}].lessons[${j}].path must be a safe relative path (no "..").`)
          }
          if (lo.title !== undefined && lo.title !== null && typeof lo.title !== 'string') {
            errors.push(`modules[${i}].lessons[${j}].title must be a string when set.`)
          }
        })
      }
    })
  }

  // Validate optional schema
  let schema: CourseSchema | undefined
  if (root.schema !== undefined && root.schema !== null) {
    if (typeof root.schema !== 'object' || Array.isArray(root.schema)) {
      errors.push('Field `schema` must be an object when set.')
    } else {
      const s = root.schema as Record<string, unknown>
      if (!Array.isArray(s.lessonFields)) {
        errors.push('Field `schema.lessonFields` must be an array.')
      } else {
        const fields: SchemaField[] = []
        s.lessonFields.forEach((field, i) => {
          if (field === null || typeof field !== 'object' || Array.isArray(field)) {
            errors.push(`schema.lessonFields[${i}]: must be an object.`)
            return
          }
          const f = field as Record<string, unknown>
          if (!isNonEmptyString(f.name)) {
            errors.push(`schema.lessonFields[${i}].name must be a non-empty string.`)
            return
          }
          const fieldType = f.type === 'number' ? 'number' : 'string'
          fields.push({
            name: (f.name as string).trim(),
            required: f.required === true,
            type: fieldType
          })
        })
        if (errors.length === 0) {
          schema = { lessonFields: fields }
        }
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  const modules = (root.modules as object[]).map((mod) => {
    const m = mod as Record<string, unknown>
    const moduleTitle =
      typeof m.title === 'string' && m.title.trim().length > 0 ? m.title.trim() : undefined
    const rawLessons = m.lessons as unknown[]
    const lessons: CourseLessonRef[] = rawLessons.map((lesson) => {
      if (typeof lesson === 'string') {
        const path = lesson.trim()
        return { path }
      }
      const lo = lesson as Record<string, unknown>
      const path = (lo.path as string).trim()
      const lessonTitle =
        typeof lo.title === 'string' && lo.title.trim().length > 0 ? lo.title.trim() : undefined
      return lessonTitle !== undefined ? { path, title: lessonTitle } : { path }
    })
    return {
      path: (m.path as string).trim(),
      title: moduleTitle,
      lessons
    }
  })

  return {
    ok: true,
    manifest: {
      title: (root.title as string).trim(),
      modules,
      ...(schema ? { schema } : {})
    }
  }
}
