import { mkdir, readFile, readdir, stat, writeFile } from 'fs/promises'
import { basename, join } from 'path'
import { parse, stringify } from 'yaml'
import { validateCourseManifestStructure } from '../../shared/course-manifest'
import { loadTemplate } from './template-store'

export type CourseAuthoringResult = { ok: true } | { ok: false; error: string }

function assertRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

async function writeValidatedManifest(
  manifestPath: string,
  data: Record<string, unknown>
): Promise<CourseAuthoringResult> {
  const yamlText = stringify(data, { indent: 2, lineWidth: 0 }) + '\n'
  let parsed: unknown
  try {
    parsed = parse(yamlText)
  } catch {
    return { ok: false, error: 'Internal error: failed to serialize manifest.' }
  }
  const validated = validateCourseManifestStructure(parsed)
  if (!validated.ok) {
    return { ok: false, error: validated.errors[0] ?? 'Manifest validation failed.' }
  }
  await writeFile(manifestPath, yamlText, 'utf-8')
  return { ok: true }
}

async function readManifestObject(courseRoot: string): Promise<
  { ok: true; path: string; data: Record<string, unknown> } | { ok: false; error: string }
> {
  const manifestPath = join(courseRoot, 'course.yaml')
  let raw: string
  try {
    raw = await readFile(manifestPath, 'utf-8')
  } catch {
    return { ok: false, error: 'course.yaml not found.' }
  }
  let parsed: unknown
  try {
    parsed = parse(raw)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: `Invalid YAML: ${message}` }
  }
  const data = assertRecord(parsed)
  if (!data) {
    return { ok: false, error: 'course.yaml must contain a YAML object.' }
  }
  return { ok: true, path: manifestPath, data }
}

/** Creates course.yaml, module folders, and lesson files from a template. Fails if course.yaml already exists. */
export async function scaffoldCourse(
  courseRoot: string,
  templateId?: string,
  courseTitle?: string
): Promise<CourseAuthoringResult> {
  const manifestPath = join(courseRoot, 'course.yaml')
  try {
    await stat(manifestPath)
    return { ok: false, error: 'A course.yaml file already exists in this folder.' }
  } catch {
    // expected: no file
  }

  const title = courseTitle?.trim() || basename(courseRoot) || 'New Course'
  const template = templateId ? loadTemplate(templateId) : null

  if (template) {
    // Scaffold from template definition
    for (const mod of template.modules) {
      const moduleDir = join(courseRoot, mod.folder)
      await mkdir(moduleDir, { recursive: true })
      for (const lesson of mod.lessons) {
        await writeFile(join(moduleDir, lesson.file), lesson.body, 'utf-8')
      }
    }

    const doc: Record<string, unknown> = {
      title,
      ...(template.schema ? { schema: template.schema } : {}),
      modules: template.modules.map((mod) => ({
        path: mod.folder,
        title: mod.title,
        lessons: mod.lessons.map((l) => l.file)
      }))
    }
    return writeValidatedManifest(manifestPath, doc)
  }

  // Fallback: minimal scaffold (same as blank template)
  const moduleFolder = '01-module'
  const moduleDir = join(courseRoot, moduleFolder)
  const lessonFile = 'lesson-01.md'

  await mkdir(moduleDir, { recursive: true })
  const lessonBody = '# Lesson 1: New lesson\n\nStart writing your lesson here.\n'
  await writeFile(join(moduleDir, lessonFile), lessonBody, 'utf-8')

  const doc: Record<string, unknown> = {
    title,
    modules: [
      {
        path: moduleFolder,
        title: 'Module 1',
        lessons: [lessonFile]
      }
    ]
  }
  return writeValidatedManifest(manifestPath, doc)
}

function nextModuleFolderName(existingModulePaths: string[]): string {
  let maxN = 0
  for (const p of existingModulePaths) {
    const m = p.match(/^(\d+)-module$/)
    if (m) {
      maxN = Math.max(maxN, parseInt(m[1], 10))
    }
  }
  const next = maxN + 1
  return `${String(next).padStart(2, '0')}-module`
}

/** Appends a new module folder with lesson-01.md and updates course.yaml. */
export async function addModuleToCourse(courseRoot: string): Promise<CourseAuthoringResult> {
  const read = await readManifestObject(courseRoot)
  if (!read.ok) {
    return read
  }
  const validated = validateCourseManifestStructure(read.data)
  if (!validated.ok) {
    return { ok: false, error: validated.errors[0] ?? 'Invalid manifest.' }
  }
  const { manifest } = validated
  const moduleFolder = nextModuleFolderName(manifest.modules.map((m) => m.path))
  const moduleDir = join(courseRoot, moduleFolder)
  try {
    await stat(moduleDir)
    return { ok: false, error: `Folder "${moduleFolder}" already exists.` }
  } catch {
    // ok
  }

  const lessonFile = 'lesson-01.md'
  await mkdir(moduleDir, { recursive: true })
  const lessonBody =
    '# Lesson 1: New lesson\n\nStart writing your lesson here.\n'
  await writeFile(join(moduleDir, lessonFile), lessonBody, 'utf-8')

  const modules = Array.isArray(read.data.modules) ? [...read.data.modules] : []
  const nextNum = manifest.modules.length + 1
  modules.push({
    path: moduleFolder,
    title: `Module ${nextNum}`,
    lessons: [lessonFile]
  })
  read.data.modules = modules
  return writeValidatedManifest(read.path, read.data)
}

function maxLessonIndexFromDir(fileNames: string[]): number {
  let maxN = 0
  for (const name of fileNames) {
    const m = name.match(/^lesson-(\d+)\.md$/i)
    if (m) {
      maxN = Math.max(maxN, parseInt(m[1], 10))
    }
  }
  return maxN
}

/** Appends a new lesson file to the module and updates course.yaml. */
export async function addLessonToModule(
  courseRoot: string,
  modulePath: string
): Promise<CourseAuthoringResult> {
  const read = await readManifestObject(courseRoot)
  if (!read.ok) {
    return read
  }
  const validated = validateCourseManifestStructure(read.data)
  if (!validated.ok) {
    return { ok: false, error: validated.errors[0] ?? 'Invalid manifest.' }
  }
  const modEntry = validated.manifest.modules.find((m) => m.path === modulePath)
  if (!modEntry) {
    return { ok: false, error: 'Module not found in manifest.' }
  }

  const moduleDir = join(courseRoot, modulePath)
  try {
    const st = await stat(moduleDir)
    if (!st.isDirectory()) {
      return { ok: false, error: 'Module path is not a directory.' }
    }
  } catch {
    return { ok: false, error: 'Module folder not found on disk.' }
  }

  let dirFiles: string[]
  try {
    dirFiles = await readdir(moduleDir)
  } catch {
    return { ok: false, error: 'Could not read module folder.' }
  }

  const maxFromDisk = maxLessonIndexFromDir(dirFiles)
  const maxFromManifest = modEntry.lessons.length
  const nextIndex = Math.max(maxFromDisk, maxFromManifest) + 1
  const lessonFile = `lesson-${String(nextIndex).padStart(2, '0')}.md`
  const lessonPath = join(moduleDir, lessonFile)
  try {
    await stat(lessonPath)
    return { ok: false, error: `File "${lessonFile}" already exists.` }
  } catch {
    // ok
  }

  const lessonBody = `# Lesson ${nextIndex}: New lesson\n\nStart writing your lesson here.\n`
  await writeFile(lessonPath, lessonBody, 'utf-8')

  const modules = read.data.modules
  if (!Array.isArray(modules)) {
    return { ok: false, error: 'Invalid manifest: modules must be an array.' }
  }
  const modYaml = modules.find(
    (m) => assertRecord(m)?.path === modulePath
  ) as Record<string, unknown> | undefined
  if (!modYaml) {
    return { ok: false, error: 'Module not found in course.yaml.' }
  }
  const lessons = Array.isArray(modYaml.lessons) ? [...modYaml.lessons] : []
  lessons.push(lessonFile)
  modYaml.lessons = lessons

  return writeValidatedManifest(read.path, read.data)
}
