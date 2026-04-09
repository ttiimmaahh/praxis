import { describe, it, expect } from 'vitest'
import { validateCourseManifestStructure } from './course-manifest'

describe('validateCourseManifestStructure', () => {
  const validManifest = {
    title: 'Test Course',
    modules: [
      {
        path: '01-intro',
        title: 'Introduction',
        lessons: ['welcome.md']
      }
    ]
  }

  it('accepts a valid manifest', () => {
    const result = validateCourseManifestStructure(validManifest)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.manifest.title).toBe('Test Course')
      expect(result.manifest.modules).toHaveLength(1)
      expect(result.manifest.modules[0].path).toBe('01-intro')
      expect(result.manifest.modules[0].lessons[0].path).toBe('welcome.md')
    }
  })

  it('accepts lessons as objects with path and title', () => {
    const data = {
      title: 'Course',
      modules: [
        {
          path: '01-mod',
          lessons: [{ path: 'lesson.md', title: 'My Lesson' }]
        }
      ]
    }
    const result = validateCourseManifestStructure(data)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.manifest.modules[0].lessons[0]).toEqual({
        path: 'lesson.md',
        title: 'My Lesson'
      })
    }
  })

  it('accepts a manifest with optional schema', () => {
    const data = {
      ...validManifest,
      schema: {
        lessonFields: [
          { name: 'difficulty', required: true, type: 'string' },
          { name: 'duration', required: false, type: 'number' }
        ]
      }
    }
    const result = validateCourseManifestStructure(data)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.manifest.schema).toBeDefined()
      expect(result.manifest.schema!.lessonFields).toHaveLength(2)
      expect(result.manifest.schema!.lessonFields[0]).toEqual({
        name: 'difficulty',
        required: true,
        type: 'string'
      })
    }
  })

  it('rejects null input', () => {
    const result = validateCourseManifestStructure(null)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/YAML object/)
    }
  })

  it('rejects an array', () => {
    const result = validateCourseManifestStructure([])
    expect(result.ok).toBe(false)
  })

  it('rejects missing title', () => {
    const result = validateCourseManifestStructure({ modules: validManifest.modules })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContainEqual(expect.stringMatching(/title/))
    }
  })

  it('rejects empty title', () => {
    const result = validateCourseManifestStructure({ title: '   ', modules: validManifest.modules })
    expect(result.ok).toBe(false)
  })

  it('rejects missing modules', () => {
    const result = validateCourseManifestStructure({ title: 'Test' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContainEqual(expect.stringMatching(/modules/))
    }
  })

  it('rejects empty modules array', () => {
    const result = validateCourseManifestStructure({ title: 'Test', modules: [] })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContainEqual(expect.stringMatching(/at least one module/))
    }
  })

  it('rejects module with missing path', () => {
    const result = validateCourseManifestStructure({
      title: 'Test',
      modules: [{ lessons: ['a.md'] }]
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContainEqual(expect.stringMatching(/modules.*0.*path/))
    }
  })

  it('rejects path traversal with ..', () => {
    const result = validateCourseManifestStructure({
      title: 'Test',
      modules: [{ path: '../escape', lessons: ['a.md'] }]
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContainEqual(expect.stringMatching(/safe relative path/))
    }
  })

  it('rejects lesson path traversal', () => {
    const result = validateCourseManifestStructure({
      title: 'Test',
      modules: [{ path: '01-mod', lessons: ['../../etc/passwd'] }]
    })
    expect(result.ok).toBe(false)
  })

  it('rejects module with empty lessons', () => {
    const result = validateCourseManifestStructure({
      title: 'Test',
      modules: [{ path: '01-mod', lessons: [] }]
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContainEqual(expect.stringMatching(/at least one lesson/))
    }
  })

  it('rejects lesson object with missing path', () => {
    const result = validateCourseManifestStructure({
      title: 'Test',
      modules: [{ path: '01-mod', lessons: [{ title: 'No path' }] }]
    })
    expect(result.ok).toBe(false)
  })

  it('trims whitespace from paths and titles', () => {
    const data = {
      title: '  Trimmed Title  ',
      modules: [
        {
          path: '  01-mod  ',
          title: '  Module Title  ',
          lessons: ['  lesson.md  ']
        }
      ]
    }
    const result = validateCourseManifestStructure(data)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.manifest.title).toBe('Trimmed Title')
      expect(result.manifest.modules[0].path).toBe('01-mod')
      expect(result.manifest.modules[0].title).toBe('Module Title')
      expect(result.manifest.modules[0].lessons[0].path).toBe('lesson.md')
    }
  })

  it('allows module without title', () => {
    const data = {
      title: 'Course',
      modules: [{ path: '01-mod', lessons: ['a.md'] }]
    }
    const result = validateCourseManifestStructure(data)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.manifest.modules[0].title).toBeUndefined()
    }
  })

  it('collects multiple errors at once', () => {
    const result = validateCourseManifestStructure({
      modules: [{ lessons: [] }]
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(1)
    }
  })
})
