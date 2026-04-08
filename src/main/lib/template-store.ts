import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, basename } from 'path'
import { app } from 'electron'
import { parse } from 'yaml'
import { BUILT_IN_TEMPLATES, BUILT_IN_TEMPLATE_IDS } from './built-in-templates'
import type { CourseTemplate, CourseTemplateMeta } from '../../shared/templates'
import type { CourseSchema, SchemaField } from '../../shared/course-manifest'

let customTemplatesDir: string | null = null

function defaultTemplatesDir(): string {
  return join(app.getPath('userData'), 'templates')
}

export function getTemplatesDir(): string {
  return customTemplatesDir ?? defaultTemplatesDir()
}

export function setCustomTemplatesDir(dir: string | null): void {
  customTemplatesDir = dir
}

/** Ensure the templates directory exists and seed built-in templates if missing. */
export function ensureTemplatesSeeded(): void {
  const dir = getTemplatesDir()
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  for (const id of BUILT_IN_TEMPLATE_IDS) {
    const filePath = join(dir, `${id}.yaml`)
    if (!existsSync(filePath)) {
      writeFileSync(filePath, BUILT_IN_TEMPLATES[id], 'utf-8')
    }
  }
}

/** List all templates in the templates directory. */
export function listTemplates(): CourseTemplateMeta[] {
  const dir = getTemplatesDir()
  ensureTemplatesSeeded()

  let files: string[]
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
  } catch {
    return []
  }

  const results: CourseTemplateMeta[] = []
  for (const file of files) {
    const id = basename(file, file.endsWith('.yaml') ? '.yaml' : '.yml')
    try {
      const raw = readFileSync(join(dir, file), 'utf-8')
      const parsed = parse(raw)
      if (parsed && typeof parsed === 'object') {
        results.push({
          id,
          name: typeof parsed.name === 'string' ? parsed.name : id,
          description: typeof parsed.description === 'string' ? parsed.description : '',
          builtIn: BUILT_IN_TEMPLATE_IDS.includes(id)
        })
      }
    } catch {
      // Skip invalid files
    }
  }

  // Sort: built-in first (in defined order), then user templates alphabetically
  results.sort((a, b) => {
    if (a.builtIn && !b.builtIn) return -1
    if (!a.builtIn && b.builtIn) return 1
    if (a.builtIn && b.builtIn) {
      return BUILT_IN_TEMPLATE_IDS.indexOf(a.id) - BUILT_IN_TEMPLATE_IDS.indexOf(b.id)
    }
    return a.name.localeCompare(b.name)
  })

  return results
}

function parseSchemaFromYaml(data: Record<string, unknown>): CourseSchema | null {
  if (!data.schema || typeof data.schema !== 'object' || Array.isArray(data.schema)) {
    return null
  }
  const s = data.schema as Record<string, unknown>
  if (!Array.isArray(s.lessonFields)) return null

  const fields: SchemaField[] = []
  for (const field of s.lessonFields) {
    if (!field || typeof field !== 'object' || Array.isArray(field)) continue
    const f = field as Record<string, unknown>
    if (typeof f.name !== 'string' || f.name.trim().length === 0) continue
    fields.push({
      name: f.name.trim(),
      required: f.required === true,
      type: f.type === 'number' ? 'number' : 'string'
    })
  }

  return fields.length > 0 ? { lessonFields: fields } : null
}

/** Load and parse a specific template by ID. */
export function loadTemplate(id: string): CourseTemplate | null {
  const dir = getTemplatesDir()
  const filePath = join(dir, `${id}.yaml`)

  let raw: string
  try {
    raw = readFileSync(filePath, 'utf-8')
  } catch {
    // Try .yml extension
    try {
      raw = readFileSync(join(dir, `${id}.yml`), 'utf-8')
    } catch {
      return null
    }
  }

  let data: unknown
  try {
    data = parse(raw)
  } catch {
    return null
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const d = data as Record<string, unknown>

  if (!Array.isArray(d.modules)) return null

  const schema = parseSchemaFromYaml(d)

  const modules = d.modules.map((mod: unknown) => {
    const m = mod as Record<string, unknown>
    const lessons = Array.isArray(m.lessons)
      ? m.lessons.map((lesson: unknown) => {
          const l = lesson as Record<string, unknown>
          return {
            file: typeof l.file === 'string' ? l.file : 'lesson.md',
            title: typeof l.title === 'string' ? l.title : '',
            body: typeof l.body === 'string' ? l.body : '# New Lesson\n\nStart writing here.\n'
          }
        })
      : []
    return {
      folder: typeof m.folder === 'string' ? m.folder : '01-module',
      title: typeof m.title === 'string' ? m.title : '',
      lessons
    }
  })

  return {
    name: typeof d.name === 'string' ? d.name : id,
    description: typeof d.description === 'string' ? d.description : '',
    schema,
    modules
  }
}
