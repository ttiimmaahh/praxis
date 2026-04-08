import { readFile, stat } from 'fs/promises'
import { join } from 'path'
import { parse } from 'yaml'
import {
  validateCourseManifestStructure,
  type LoadCourseManifestResult
} from '../../shared/course-manifest'
import {
  extractLessonDisplayTitle,
  parseFrontmatter
} from '../../shared/lesson-title-from-markdown'

export type { LoadCourseManifestResult }

function posixDisplay(modulePath: string, lesson: string): string {
  return join(modulePath, lesson).split(/[/\\]/).filter(Boolean).join('/')
}

export async function loadCourseManifest(courseRoot: string): Promise<LoadCourseManifestResult> {
  const manifestPath = join(courseRoot, 'course.yaml')

  let raw: string
  try {
    raw = await readFile(manifestPath, 'utf-8')
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'ENOENT') {
      return { status: 'no-manifest' }
    }
    throw error
  }

  let parsed: unknown
  try {
    parsed = parse(raw)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const hint = /alias|anchor/i.test(message)
      ? ' In YAML, `&` and `*` are special — wrap strings that contain `&` in double quotes.'
      : ''
    return { status: 'invalid', errors: [`Invalid YAML: ${message}${hint}`] }
  }

  const validated = validateCourseManifestStructure(parsed)
  if (!validated.ok) {
    return { status: 'invalid', errors: validated.errors }
  }

  const { manifest } = validated
  const warnings: string[] = []

  for (const mod of manifest.modules) {
    const moduleDir = join(courseRoot, mod.path)
    try {
      const st = await stat(moduleDir)
      if (!st.isDirectory()) {
        warnings.push(`Module path "${mod.path}" exists but is not a directory.`)
      }
    } catch {
      warnings.push(`Module folder missing: ${mod.path}`)
    }

    for (const lesson of mod.lessons) {
      const lessonPath = join(courseRoot, mod.path, lesson.path)
      const display = posixDisplay(mod.path, lesson.path)
      try {
        const st = await stat(lessonPath)
        if (!st.isFile()) {
          warnings.push(`Lesson "${display}" exists but is not a file.`)
          continue
        }
        const content = await readFile(lessonPath, 'utf-8')
        const yamlTitle = lesson.title?.trim()
        if (!yamlTitle) {
          const fromDoc = extractLessonDisplayTitle(content)
          if (fromDoc) {
            lesson.title = fromDoc
          }
        }
        // Validate frontmatter against schema
        if (manifest.schema?.lessonFields) {
          const fm = parseFrontmatter(content)
          for (const field of manifest.schema.lessonFields) {
            if (!field.required) continue
            const value = fm?.[field.name]
            if (value === undefined || value === null || value === '') {
              warnings.push(`Lesson "${display}": missing required field "${field.name}"`)
            }
          }
        }
      } catch {
        warnings.push(`Lesson file missing: ${display}`)
      }
    }
  }

  return { status: 'ok', manifest, warnings }
}
