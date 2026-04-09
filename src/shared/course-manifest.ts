import { z } from 'zod'

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

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

/** Reject `..` and empty segments in a path string. */
const safeRelativePath = z.string().trim().min(1).refine(
  (value) => {
    const segments = value.split(/[/\\]/).filter((s) => s.length > 0)
    return segments.length > 0 && segments.every((s) => s !== '..')
  },
  { message: 'Must be a safe relative path (no "..").' }
)

const CourseLessonRefObjectSchema = z.object({
  path: safeRelativePath,
  title: z.string().trim().min(1).optional()
})

const CourseLessonRefSchema = z.union([
  safeRelativePath.transform((path) => ({ path })),
  CourseLessonRefObjectSchema
])

const SchemaFieldSchema = z.object({
  name: z.string().trim().min(1),
  required: z.boolean().optional().default(false),
  type: z.enum(['string', 'number']).optional().default('string')
})

const CourseSchemaSchema = z.object({
  lessonFields: z.array(SchemaFieldSchema).min(1)
})

const CourseManifestSchema = z.object({
  title: z.string().trim().min(1, 'Field `title` must be a non-empty string.'),
  modules: z
    .array(
      z.object({
        path: safeRelativePath,
        title: z.string().trim().optional(),
        lessons: z.array(CourseLessonRefSchema).min(1, 'Must list at least one lesson.')
      })
    )
    .min(1, 'Field `modules` must contain at least one module.'),
  schema: CourseSchemaSchema.optional()
})

export function validateCourseManifestStructure(
  data: unknown
): { ok: true; manifest: CourseManifestParsed } | { ok: false; errors: string[] } {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, errors: ['Manifest must be a YAML object at the root.'] }
  }

  const result = CourseManifestSchema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : ''
      return path ? `${path}: ${issue.message}` : issue.message
    })
    return { ok: false, errors }
  }

  const parsed = result.data
  const manifest: CourseManifestParsed = {
    title: parsed.title,
    modules: parsed.modules.map((mod) => ({
      path: mod.path,
      title: mod.title && mod.title.length > 0 ? mod.title : undefined,
      lessons: mod.lessons.map((lesson) => {
        // Zod union: `string → { path }` OR `{ path, title? }`. The string
        // branch has no `title` key at all, so narrow with `'title' in lesson`
        // before touching it.
        const title = 'title' in lesson ? lesson.title : undefined
        return title ? { path: lesson.path, title } : { path: lesson.path }
      })
    })),
    ...(parsed.schema ? { schema: parsed.schema } : {})
  }

  return { ok: true, manifest }
}
