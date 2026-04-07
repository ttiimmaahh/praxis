import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { app } from 'electron'

export interface JsonStoreOptions {
  fileName: string
  defaults: Record<string, unknown>
}

export class JsonStore<T extends Record<string, unknown>> {
  private readonly filePath: string
  private data: T

  constructor(options: JsonStoreOptions) {
    const userDataPath = app.getPath('userData')
    this.filePath = join(userDataPath, options.fileName)
    this.data = this.load(options.defaults as T)
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.data[key]
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.data[key] = value
    this.save()
  }

  getAll(): T {
    return { ...this.data }
  }

  setAll(data: Partial<T>): void {
    this.data = { ...this.data, ...data }
    this.save()
  }

  private load(defaults: T): T {
    try {
      if (!existsSync(this.filePath)) return { ...defaults }
      const raw = readFileSync(this.filePath, 'utf-8')
      return { ...defaults, ...JSON.parse(raw) }
    } catch {
      return { ...defaults }
    }
  }

  private save(): void {
    try {
      const dir = dirname(this.filePath)
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
      writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch (error) {
      console.error(`[JsonStore] Failed to write ${this.filePath}:`, error)
    }
  }
}
