import { useState, useEffect, useCallback, useRef } from 'react'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useCourseStore } from '@/stores/course-store'
import { shouldReloadCourseManifestAfterSave } from '@/lib/course-manifest-reload'
import { TabBar } from '@/components/editor/TabBar'
import { MarkdownEditor, type MarkdownEditorHandle } from '@/components/editor/MarkdownEditor'
import { YamlEditor } from '@/components/editor/YamlEditor'
import { DocumentOutline } from '@/components/editor/DocumentOutline'
import { countWords, readingTimeMinutes } from '@/lib/word-stats'
import { isYamlFilePath } from '@/lib/editor-path'
import { isCourseYamlAtWorkspaceRoot } from '@/lib/path-utils'
import { cn } from '@/lib/utils'

const fileContentCache = new Map<string, string>()

/** Stored frontmatter blocks keyed by file path — edited separately from document body. */
const frontmatterCache = new Map<string, string>()

function splitFrontmatter(content: string): { frontmatter: string; body: string } {
  const text = content.replace(/^\uFEFF/, '')
  if (!text.startsWith('---')) return { frontmatter: '', body: content }
  const end = text.indexOf('\n---', 3)
  if (end === -1) return { frontmatter: '', body: content }
  // Include the closing --- and the newline after it
  const fmEnd = end + 4
  return {
    frontmatter: text.slice(0, fmEnd),
    body: text.slice(fmEnd)
  }
}

function joinFrontmatter(filePath: string, body: string): string {
  const fm = frontmatterCache.get(filePath)
  if (!fm) return body
  return fm + body
}

export function EditorArea(): React.JSX.Element {
  const openTabs = useWorkspaceStore((s) => s.openTabs)
  const activeTabPath = useWorkspaceStore((s) => s.activeTabPath)
  const outlineOpen = useWorkspaceStore((s) => s.outlineOpen)
  const markDirty = useWorkspaceStore((s) => s.markDirty)
  const closeFile = useWorkspaceStore((s) => s.closeFile)
  const rootPath = useWorkspaceStore((s) => s.rootPath)
  const loadCourseForRoot = useCourseStore((s) => s.loadForRoot)

  const [loadedContent, setLoadedContent] = useState<string | null>(null)
  const [loadedContentPath, setLoadedContentPath] = useState<string | null>(null)
  const [liveMarkdown, setLiveMarkdown] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const saveTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const editorRef = useRef<MarkdownEditorHandle | null>(null)

  useEffect(() => {
    if (!activeTabPath) {
      setLoadedContent(null)
      setLoadedContentPath(null)
      setLiveMarkdown('')
      return
    }

    const cached = fileContentCache.get(activeTabPath)
    if (cached !== undefined) {
      const isMarkdown = !isYamlFilePath(activeTabPath)
      if (isMarkdown) {
        const { frontmatter, body } = splitFrontmatter(cached)
        if (frontmatter) frontmatterCache.set(activeTabPath, frontmatter)
        setLoadedContent(body)
        setLoadedContentPath(activeTabPath)
        setLiveMarkdown(body)
      } else {
        setLoadedContent(cached)
        setLoadedContentPath(activeTabPath)
        setLiveMarkdown(cached)
      }
      return
    }

    let cancelled = false
    setIsLoading(true)
    window.electronAPI
      .readFile(activeTabPath)
      .then((content) => {
        if (cancelled) return
        fileContentCache.set(activeTabPath, content)
        const isMarkdown = !isYamlFilePath(activeTabPath)
        if (isMarkdown) {
          const { frontmatter, body } = splitFrontmatter(content)
          if (frontmatter) {
            frontmatterCache.set(activeTabPath, frontmatter)
          } else {
            frontmatterCache.delete(activeTabPath)
          }
          setLoadedContent(body)
          setLoadedContentPath(activeTabPath)
          setLiveMarkdown(body)
        } else {
          setLoadedContent(content)
          setLoadedContentPath(activeTabPath)
          setLiveMarkdown(content)
        }
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Failed to load file:', error)
        setLoadedContent('')
        setLoadedContentPath(activeTabPath)
        setLiveMarkdown('')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeTabPath])

  const handleContentChange = useCallback(
    (filePath: string, newContent: string) => {
      // For markdown files, rejoin frontmatter for storage/saving
      const fullContent = !isYamlFilePath(filePath)
        ? joinFrontmatter(filePath, newContent)
        : newContent
      fileContentCache.set(filePath, fullContent)
      if (filePath === activeTabPath) {
        setLiveMarkdown(newContent)
      }

      const existingTimer = saveTimersRef.current.get(filePath)
      if (existingTimer) clearTimeout(existingTimer)
      const debounceMs =
        rootPath !== null && isCourseYamlAtWorkspaceRoot(filePath, rootPath) ? 300 : 1000
      const timerId = setTimeout(async () => {
        saveTimersRef.current.delete(filePath)
        try {
          await window.electronAPI.writeFile(filePath, fullContent)
          markDirty(filePath, false)
          const courseStatus = useCourseStore.getState().status
          if (shouldReloadCourseManifestAfterSave(filePath, rootPath, courseStatus)) {
            void loadCourseForRoot(rootPath)
          }
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }, debounceMs)
      saveTimersRef.current.set(filePath, timerId)
    },
    [activeTabPath, markDirty, rootPath, loadCourseForRoot]
  )

  const flushSave = useCallback((): void => {
    if (!activeTabPath) return
    const content = fileContentCache.get(activeTabPath)
    if (content === undefined) return
    const existingTimer = saveTimersRef.current.get(activeTabPath)
    if (existingTimer) {
      clearTimeout(existingTimer)
      saveTimersRef.current.delete(activeTabPath)
    }
    window.electronAPI.writeFile(activeTabPath, content).then(() => {
      markDirty(activeTabPath, false)
      const courseStatus = useCourseStore.getState().status
      if (shouldReloadCourseManifestAfterSave(activeTabPath, rootPath, courseStatus)) {
        void loadCourseForRoot(rootPath)
      }
    })
  }, [activeTabPath, markDirty, rootPath, loadCourseForRoot])

  useEffect(() => {
    const timers = saveTimersRef.current
    return () => {
      for (const timerId of timers.values()) clearTimeout(timerId)
      timers.clear()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return
      const key = event.key.toLowerCase()
      if (key === 's') {
        event.preventDefault()
        flushSave()
        return
      }
      if (key === 'w') {
        event.preventDefault()
        if (activeTabPath) closeFile(activeTabPath)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTabPath, closeFile, flushSave])

  useEffect(() => {
    const onSave = (): void => {
      flushSave()
    }
    const onClose = (): void => {
      if (activeTabPath) closeFile(activeTabPath)
    }
    window.addEventListener('praxis:save-active', onSave)
    window.addEventListener('praxis:close-active', onClose)
    return () => {
      window.removeEventListener('praxis:save-active', onSave)
      window.removeEventListener('praxis:close-active', onClose)
    }
  }, [activeTabPath, closeFile, flushSave])

  const wordCount = countWords(liveMarkdown)
  const readMinutes = readingTimeMinutes(wordCount)
  const activeIsYaml = activeTabPath !== null && isYamlFilePath(activeTabPath)
  const yamlLineCount = activeIsYaml ? liveMarkdown.split(/\r?\n/).length : 0
  const yamlCharCount = activeIsYaml ? liveMarkdown.length : 0

  const handleJumpToHeading = useCallback((headingIndex: number) => {
    if (activeTabPath && isYamlFilePath(activeTabPath)) return
    editorRef.current?.scrollToHeadingIndex(headingIndex)
  }, [activeTabPath])

  if (openTabs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <span className="text-lg font-medium">No files open</span>
        <span className="text-sm text-muted-foreground/60">
          Open a folder and select a file to start editing
        </span>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <TabBar />
      <div
        className={cn(
          'flex min-h-0 flex-1 overflow-hidden',
          outlineOpen && !activeIsYaml && 'flex-row'
        )}
      >
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-8 shrink-0 items-center justify-end border-b border-border/50 bg-muted/20 px-3 text-[11px] tabular-nums text-muted-foreground">
            <span>
              {activeIsYaml ? (
                <>
                  {yamlLineCount.toLocaleString()} lines · {yamlCharCount.toLocaleString()} characters · YAML
                </>
              ) : (
                <>
                  {wordCount.toLocaleString()} words
                  {wordCount > 0 ? ` · ~${readMinutes} min read` : ''}
                </>
              )}
            </span>
          </div>
          <div
            className={cn(
              'relative min-h-0 flex-1',
              activeIsYaml
                ? 'flex flex-col overflow-hidden'
                : 'overflow-hidden'
            )}
          >
            {isLoading || (activeTabPath && loadedContentPath !== activeTabPath) ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : activeTabPath && loadedContent !== null ? (
              activeIsYaml ? (
                <YamlEditor
                  key={activeTabPath}
                  filePath={activeTabPath}
                  content={liveMarkdown}
                  onContentChange={handleContentChange}
                />
              ) : (
                <MarkdownEditor
                  ref={editorRef}
                  key={activeTabPath}
                  filePath={activeTabPath}
                  content={loadedContent}
                  onContentChange={handleContentChange}
                />
              )
            ) : null}
          </div>
        </div>
        {outlineOpen && !activeIsYaml ? (
          <DocumentOutline markdown={liveMarkdown} onJumpToHeading={handleJumpToHeading} />
        ) : null}
      </div>
    </div>
  )
}
