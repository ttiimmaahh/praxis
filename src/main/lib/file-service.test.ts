import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  readDirectory,
  readFileContent,
  writeFileContent,
  createFile,
  createDirectory,
  renameEntry,
  deleteEntry
} from './file-service'

let tempDir: string

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'praxis-test-'))
})

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

describe('readDirectory', () => {
  it('lists files and directories', async () => {
    await mkdir(join(tempDir, 'subdir'))
    await writeFile(join(tempDir, 'file.md'), 'hello')

    const entries = await readDirectory(tempDir)
    expect(entries).toHaveLength(2)
    expect(entries[0].name).toBe('subdir')
    expect(entries[0].isDirectory).toBe(true)
    expect(entries[1].name).toBe('file.md')
    expect(entries[1].isDirectory).toBe(false)
    expect(entries[1].extension).toBe('.md')
  })

  it('sorts directories before files', async () => {
    await writeFile(join(tempDir, 'aaa.txt'), '')
    await mkdir(join(tempDir, 'zzz'))

    const entries = await readDirectory(tempDir)
    expect(entries[0].name).toBe('zzz')
    expect(entries[1].name).toBe('aaa.txt')
  })

  it('excludes hidden files', async () => {
    await writeFile(join(tempDir, '.hidden'), '')
    await writeFile(join(tempDir, 'visible.md'), '')

    const entries = await readDirectory(tempDir)
    expect(entries).toHaveLength(1)
    expect(entries[0].name).toBe('visible.md')
  })

  it('returns empty array for empty directory', async () => {
    const entries = await readDirectory(tempDir)
    expect(entries).toEqual([])
  })
})

describe('readFileContent / writeFileContent', () => {
  it('reads and writes file content', async () => {
    const filePath = join(tempDir, 'test.md')
    await writeFileContent(filePath, '# Hello World')
    const content = await readFileContent(filePath)
    expect(content).toBe('# Hello World')
  })
})

describe('createFile', () => {
  it('creates an empty file and returns its path', async () => {
    const path = await createFile(tempDir, 'new-file.md')
    expect(path).toBe(join(tempDir, 'new-file.md'))
    const content = await readFileContent(path)
    expect(content).toBe('')
  })
})

describe('createDirectory', () => {
  it('creates a directory and returns its path', async () => {
    const path = await createDirectory(tempDir, 'new-dir')
    expect(path).toBe(join(tempDir, 'new-dir'))
    const entries = await readDirectory(tempDir)
    expect(entries[0].name).toBe('new-dir')
    expect(entries[0].isDirectory).toBe(true)
  })
})

describe('renameEntry', () => {
  it('renames a file and returns the new path', async () => {
    const oldPath = join(tempDir, 'old.md')
    await writeFile(oldPath, 'content')

    const newPath = await renameEntry(oldPath, 'new.md')
    expect(newPath).toBe(join(tempDir, 'new.md'))
    const content = await readFileContent(newPath)
    expect(content).toBe('content')
  })
})

describe('deleteEntry', () => {
  it('deletes a file', async () => {
    const filePath = join(tempDir, 'delete-me.md')
    await writeFile(filePath, 'bye')

    await deleteEntry(filePath)
    const entries = await readDirectory(tempDir)
    expect(entries).toHaveLength(0)
  })

  it('deletes a directory recursively', async () => {
    const dirPath = join(tempDir, 'delete-dir')
    await mkdir(dirPath)
    await writeFile(join(dirPath, 'child.md'), '')

    await deleteEntry(dirPath)
    const entries = await readDirectory(tempDir)
    expect(entries).toHaveLength(0)
  })
})
