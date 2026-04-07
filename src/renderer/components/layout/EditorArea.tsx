import { useState, useEffect, useCallback, useRef } from 'react'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { TabBar } from '@/components/editor/TabBar'
import { MarkdownEditor, type MarkdownEditorHandle } from '@/components/editor/MarkdownEditor'
import { DocumentOutline } from '@/components/editor/DocumentOutline'
import { countWords, readingTimeMinutes } from '@/lib/word-stats'
import { cn } from '@/lib/utils'

const fileContentCache = new Map<string, string>()

export function EditorArea(): React.JSX.Element {
  const openTabs = useWorkspaceStore((s) => s.openTabs)
  const activeTabPath = useWorkspaceStore((s) => s.activeTabPath)
  const outlineOpen = useWorkspaceStore((s) => s.outlineOpen)
  const markDirty = useWorkspaceStore((s) => s.markDirty)
  const closeFile = useWorkspaceStore((s) => s.closeFile)

  const [loadedContent, setLoadedContent] = useState<string | null>(null)
  const [liveMarkdown, setLiveMarkdown] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorRef = useRef<MarkdownEditorHandle | null>(null)

  useEffect(() => {
    if (!activeTabPath) {
      setLoadedContent(null)
      setLiveMarkdown('')
      return
    }

    const cached = fileContentCache.get(activeTabPath)
    if (cached !== undefined) {
      setLoadedContent(cached)
      setLiveMarkdown(cached)
      return
    }

    setIsLoading(true)
    window.electronAPI
      .readFile(activeTabPath)
      .then((content) => {
        fileContentCache.set(activeTabPath, content)
        setLoadedContent(content)
        setLiveMarkdown(content)
      })
      .catch((error) => {
        console.error('Failed to load file:', error)
        setLoadedContent('')
        setLiveMarkdown('')
      })
      .finally(() => setIsLoading(false))
  }, [activeTabPath])

  const handleContentChange = useCallback(
    (filePath: string, newContent: string) => {
      fileContentCache.set(filePath, newContent)
      if (filePath === activeTabPath) {
        setLiveMarkdown(newContent)
      }

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        try {
          await window.electronAPI.writeFile(filePath, newContent)
          markDirty(filePath, false)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }, 1000)
    },
    [activeTabPath, markDirty]
  )

  const flushSave = useCallback((): void => {
    if (!activeTabPath) return
    const content = fileContentCache.get(activeTabPath)
    if (content === undefined) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    window.electronAPI.writeFile(activeTabPath, content).then(() => {
      markDirty(activeTabPath, false)
    })
  }, [activeTabPath, markDirty])

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
    window.addEventListener('md-editor:save-active', onSave)
    window.addEventListener('md-editor:close-active', onClose)
    return () => {
      window.removeEventListener('md-editor:save-active', onSave)
      window.removeEventListener('md-editor:close-active', onClose)
    }
  }, [activeTabPath, closeFile, flushSave])

  const wordCount = countWords(liveMarkdown)
  const readMinutes = readingTimeMinutes(wordCount)

  const handleJumpToHeading = useCallback((headingIndex: number) => {
    editorRef.current?.scrollToHeadingIndex(headingIndex)
  }, [])

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
          outlineOpen && 'flex-row'
        )}
      >
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-8 shrink-0 items-center justify-end border-b border-border/50 bg-muted/20 px-3 text-[11px] tabular-nums text-muted-foreground">
            <span>
              {wordCount.toLocaleString()} words
              {wordCount > 0 ? ` · ~${readMinutes} min read` : ''}
            </span>
          </div>
          <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [touch-action:pan-y]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : activeTabPath && loadedContent !== null ? (
              <MarkdownEditor
                ref={editorRef}
                key={activeTabPath}
                filePath={activeTabPath}
                content={loadedContent}
                onContentChange={handleContentChange}
              />
            ) : null}
          </div>
        </div>
        {outlineOpen ? (
          <DocumentOutline markdown={liveMarkdown} onJumpToHeading={handleJumpToHeading} />
        ) : null}
      </div>
    </div>
  )
}
