import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, stat, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { parse } from 'yaml'
import { scaffoldCourse, addModuleToCourse, addLessonToModule } from './course-authoring'

let tempDir: string

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'praxis-authoring-'))
})

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

describe('scaffoldCourse', () => {
  it('creates a minimal course structure without a template', async () => {
    const result = await scaffoldCourse(tempDir, undefined, 'My Course')
    expect(result.ok).toBe(true)

    const manifestRaw = await readFile(join(tempDir, 'course.yaml'), 'utf-8')
    const manifest = parse(manifestRaw)
    expect(manifest.title).toBe('My Course')
    expect(manifest.modules).toHaveLength(1)
    expect(manifest.modules[0].path).toBe('01-module')

    const lessonStat = await stat(join(tempDir, '01-module', 'lesson-01.md'))
    expect(lessonStat.isFile()).toBe(true)
  })

  it('uses folder basename when no title provided', async () => {
    const result = await scaffoldCourse(tempDir)
    expect(result.ok).toBe(true)

    const manifestRaw = await readFile(join(tempDir, 'course.yaml'), 'utf-8')
    const manifest = parse(manifestRaw)
    expect(manifest.title).toBeTruthy()
  })

  it('fails if course.yaml already exists', async () => {
    await writeFile(join(tempDir, 'course.yaml'), 'title: Existing')
    const result = await scaffoldCourse(tempDir)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/already exists/)
    }
  })
})

describe('addModuleToCourse', () => {
  beforeEach(async () => {
    await scaffoldCourse(tempDir, undefined, 'Test Course')
  })

  it('adds a new module folder and updates manifest', async () => {
    const result = await addModuleToCourse(tempDir)
    expect(result.ok).toBe(true)

    const manifestRaw = await readFile(join(tempDir, 'course.yaml'), 'utf-8')
    const manifest = parse(manifestRaw)
    expect(manifest.modules).toHaveLength(2)
    expect(manifest.modules[1].path).toBe('02-module')

    const lessonStat = await stat(join(tempDir, '02-module', 'lesson-01.md'))
    expect(lessonStat.isFile()).toBe(true)
  })

  it('increments module number correctly', async () => {
    await addModuleToCourse(tempDir)
    await addModuleToCourse(tempDir)

    const manifestRaw = await readFile(join(tempDir, 'course.yaml'), 'utf-8')
    const manifest = parse(manifestRaw)
    expect(manifest.modules).toHaveLength(3)
    expect(manifest.modules[2].path).toBe('03-module')
  })
})

describe('addLessonToModule', () => {
  beforeEach(async () => {
    await scaffoldCourse(tempDir, undefined, 'Test Course')
  })

  it('adds a new lesson file and updates manifest', async () => {
    const result = await addLessonToModule(tempDir, '01-module')
    expect(result.ok).toBe(true)

    const manifestRaw = await readFile(join(tempDir, 'course.yaml'), 'utf-8')
    const manifest = parse(manifestRaw)
    expect(manifest.modules[0].lessons).toHaveLength(2)
    expect(manifest.modules[0].lessons[1]).toBe('lesson-02.md')

    const lessonStat = await stat(join(tempDir, '01-module', 'lesson-02.md'))
    expect(lessonStat.isFile()).toBe(true)
  })

  it('fails for a nonexistent module', async () => {
    const result = await addLessonToModule(tempDir, 'nonexistent')
    expect(result.ok).toBe(false)
  })
})
