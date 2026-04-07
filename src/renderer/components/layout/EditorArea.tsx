import { useState, useEffect, useCallback, useRef } from 'react'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { TabBar } from '@/components/editor/TabBar'
import { MarkdownEditor } from '@/components/editor/MarkdownEditor'

const fileContentCache = new Map<string, string>()

export function EditorArea(): React.JSX.Element {
  const openTabs = useWorkspaceStore((s) => s.openTabs)
  const activeTabPath = useWorkspaceStore((s) => s.activeTabPath)
  const markDirty = useWorkspaceStore((s) => s.markDirty)
  const [loadedContent, setLoadedContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!activeTabPath) {
      setLoadedContent(null)
      return
    }

    const cached = fileContentCache.get(activeTabPath)
    if (cached !== undefined) {
      setLoadedContent(cached)
      return
    }

    setIsLoading(true)
    window.electronAPI
      .readFile(activeTabPath)
      .then((content) => {
        fileContentCache.set(activeTabPath, content)
        setLoadedContent(content)
      })
      .catch((error) => {
        console.error('Failed to load file:', error)
        setLoadedContent('')
      })
      .finally(() => setIsLoading(false))
  }, [activeTabPath])

  const handleContentChange = useCallback(
    (filePath: string, newContent: string) => {
      fileContentCache.set(filePath, newContent)

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
    [markDirty]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (!activeTabPath) return
        const content = fileContentCache.get(activeTabPath)
        if (content === undefined) return

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        window.electronAPI.writeFile(activeTabPath, content).then(() => {
          markDirty(activeTabPath, false)
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTabPath, markDirty])

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
    <div className="flex h-full flex-col bg-background">
      <TabBar />
      <div className="relative flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : activeTabPath && loadedContent !== null ? (
          <MarkdownEditor
            key={activeTabPath}
            filePath={activeTabPath}
            content={loadedContent}
            onContentChange={handleContentChange}
          />
        ) : null}
      </div>
    </div>
  )
}
