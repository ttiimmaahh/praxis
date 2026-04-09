import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { mkdirSync } from 'fs'
import { setCustomTemplatesDir, listTemplates, loadTemplate } from './template-store'

let tempDir: string

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'praxis-templates-'))
  mkdirSync(tempDir, { recursive: true })
  setCustomTemplatesDir(tempDir)
})

afterEach(async () => {
  setCustomTemplatesDir(null)
  await rm(tempDir, { recursive: true, force: true })
})

describe('listTemplates', () => {
  it('lists yaml files in the templates directory', async () => {
    await writeFile(
      join(tempDir, 'test-template.yaml'),
      'name: Test Template\ndescription: A test\nmodules:\n  - folder: 01-mod\n    title: Module 1\n    lessons:\n      - file: lesson-01.md\n        title: Lesson 1\n        body: "# Lesson"\n'
    )

    const templates = listTemplates()
    const userTemplates = templates.filter((t) => !t.builtIn)
    expect(userTemplates.length).toBeGreaterThanOrEqual(1)
    expect(userTemplates.find((t) => t.id === 'test-template')).toBeDefined()
  })

  it('returns built-in templates even with empty custom dir', () => {
    const templates = listTemplates()
    const builtIn = templates.filter((t) => t.builtIn)
    expect(builtIn.length).toBeGreaterThan(0)
  })

  it('skips invalid yaml files', async () => {
    await writeFile(join(tempDir, 'bad.yaml'), ':::invalid:::yaml')
    const templates = listTemplates()
    expect(templates.find((t) => t.id === 'bad')).toBeUndefined()
  })
})

describe('loadTemplate', () => {
  it('loads a valid template', async () => {
    await writeFile(
      join(tempDir, 'my-template.yaml'),
      [
        'name: My Template',
        'description: Testing',
        'modules:',
        '  - folder: 01-intro',
        '    title: Intro',
        '    lessons:',
        '      - file: welcome.md',
        '        title: Welcome',
        '        body: "# Welcome\\n\\nHello!"'
      ].join('\n')
    )

    const template = loadTemplate('my-template')
    expect(template).not.toBeNull()
    expect(template!.name).toBe('My Template')
    expect(template!.modules).toHaveLength(1)
    expect(template!.modules[0].lessons[0].file).toBe('welcome.md')
  })

  it('returns null for nonexistent template', () => {
    const template = loadTemplate('does-not-exist')
    expect(template).toBeNull()
  })

  it('returns null for template with no modules', async () => {
    await writeFile(join(tempDir, 'no-modules.yaml'), 'name: Empty\ndescription: No modules\n')
    const template = loadTemplate('no-modules')
    expect(template).toBeNull()
  })
})
