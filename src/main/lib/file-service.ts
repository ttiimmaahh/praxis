import { readdir, readFile, writeFile, mkdir, rename, rm, stat } from 'fs/promises'
import { join, basename, extname } from 'path'

export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  extension: string
}

export async function readDirectory(directoryPath: string): Promise<FileEntry[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true })

  const mapped: FileEntry[] = entries
    .filter((entry) => !entry.name.startsWith('.'))
    .map((entry) => ({
      name: entry.name,
      path: join(directoryPath, entry.name),
      isDirectory: entry.isDirectory(),
      extension: entry.isDirectory() ? '' : extname(entry.name).toLowerCase()
    }))

  mapped.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })

  return mapped
}

export async function readFileContent(filePath: string): Promise<string> {
  return readFile(filePath, 'utf-8')
}

export async function writeFileContent(filePath: string, content: string): Promise<void> {
  await writeFile(filePath, content, 'utf-8')
}

export async function createFile(parentPath: string, fileName: string): Promise<string> {
  const filePath = join(parentPath, fileName)
  await writeFile(filePath, '', 'utf-8')
  return filePath
}

export async function createDirectory(parentPath: string, dirName: string): Promise<string> {
  const dirPath = join(parentPath, dirName)
  await mkdir(dirPath, { recursive: true })
  return dirPath
}

export async function renameEntry(oldPath: string, newName: string): Promise<string> {
  const parentDir = join(oldPath, '..')
  const newPath = join(parentDir, newName)
  await rename(oldPath, newPath)
  return newPath
}

export async function deleteEntry(entryPath: string): Promise<void> {
  const entryInfo = await stat(entryPath)
  await rm(entryPath, { recursive: entryInfo.isDirectory(), force: false })
}

export async function getBaseName(filePath: string): Promise<string> {
  return basename(filePath)
}
