import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, basename } from 'path'
import { app } from 'electron'
import { parse } from 'yaml'
import { z } from 'zod'
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

// ---------------------------------------------------------------------------
// Zod schemas for template YAML
// ---------------------------------------------------------------------------

const TemplateMetaSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional()
})

const TemplateSchemaFieldSchema = z.object({
  name: z.string().min(1),
  required: z.boolean().optional().default(false),
  type: z.enum(['string', 'number']).optional().default('string')
})

const TemplateLessonSchema = z.object({
  file: z.string().optional().default('lesson.md'),
  title: z.string().optional().default(''),
  body: z.string().optional().default('# New Lesson\n\nStart writing here.\n')
})

const TemplateModuleSchema = z.object({
  folder: z.string().optional().default('01-module'),
  title: z.string().optional().default(''),
  lessons: z.array(TemplateLessonSchema).optional().default([])
})

const TemplateSchema = TemplateMetaSchema.extend({
  modules: z.array(TemplateModuleSchema),
  schema: z
    .object({ lessonFields: z.array(TemplateSchemaFieldSchema) })
    .optional()
})

// ---------------------------------------------------------------------------

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
  } catch (e) {
    console.error('Failed to read templates directory:', e)
    return []
  }

  const results: CourseTemplateMeta[] = []
  for (const file of files) {
    const id = basename(file, file.endsWith('.yaml') ? '.yaml' : '.yml')
    try {
      const raw = readFileSync(join(dir, file), 'utf-8')
      const parsed = parse(raw)
      const meta = TemplateMetaSchema.safeParse(parsed)
      if (meta.success) {
        results.push({
          id,
          name: meta.data.name ?? id,
          description: meta.data.description ?? '',
          builtIn: BUILT_IN_TEMPLATE_IDS.includes(id)
        })
      }
    } catch (e) {
      console.warn(`Skipping invalid template ${file}:`, e)
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

function parseSchemaFromZod(
  schema: z.infer<typeof TemplateSchema>['schema']
): CourseSchema | null {
  if (!schema || schema.lessonFields.length === 0) return null
  const fields: SchemaField[] = schema.lessonFields.map((f) => ({
    name: f.name.trim(),
    required: f.required,
    type: f.type
  }))
  return { lessonFields: fields }
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
  } catch (e) {
    console.error(`Failed to parse template ${id}:`, e)
    return null
  }

  const result = TemplateSchema.safeParse(data)
  if (!result.success) return null

  const template = result.data
  const schema = parseSchemaFromZod(template.schema)

  return {
    name: template.name ?? id,
    description: template.description ?? '',
    schema,
    modules: template.modules.map((mod) => ({
      folder: mod.folder,
      title: mod.title,
      lessons: mod.lessons.map((lesson) => ({
        file: lesson.file,
        title: lesson.title,
        body: lesson.body
      }))
    }))
  }
}
