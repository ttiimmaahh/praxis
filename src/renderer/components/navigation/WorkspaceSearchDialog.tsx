import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { basenameFromPath } from '@/lib/path-utils'
import { cn } from '@/lib/utils'
import { FileSearch, Loader2 } from 'lucide-react'

export function WorkspaceSearchDialog(): React.JSX.Element {
  const rootPath = useWorkspaceStore((s) => s.rootPath)
  const open = useWorkspaceStore((s) => s.workspaceSearchOpen)
  const setOpen = useWorkspaceStore((s) => s.setWorkspaceSearchOpen)
  const openFile = useWorkspaceStore((s) => s.openFile)

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<WorkspaceSearchMatch[]>([])

  const runSearch = useCallback(
    async (q: string) => {
      if (!rootPath || q.trim().length === 0) {
        setMatches([])
        return
      }
      setLoading(true)
      try {
        const results = await window.electronAPI.searchWorkspace(rootPath, q)
        setMatches(results)
      } catch (error) {
        console.error('Workspace search failed:', error)
        setMatches([])
      } finally {
        setLoading(false)
      }
    },
    [rootPath]
  )

  useEffect(() => {
    if (!open) {
      setQuery('')
      setMatches([])
      return
    }
    const t = window.setTimeout(() => {
      void runSearch(query)
    }, 200)
    return () => window.clearTimeout(t)
  }, [open, query, runSearch])

  function handleSelectResult(filePath: string): void {
    const name = basenameFromPath(filePath)
    openFile(filePath, name)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader className="border-b border-border/60 px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileSearch className="h-4 w-4 text-muted-foreground" aria-hidden />
            Search in workspace
          </DialogTitle>
          <DialogDescription className="text-xs">
            Find text across all Markdown files in the open folder.
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 pt-3">
          <Input
            autoFocus
            placeholder="Search…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-9"
          />
        </div>
        <ScrollArea className="max-h-[min(320px,40vh)] border-t border-border/40">
          <div className="p-2">
            {!rootPath ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">Open a folder first</p>
            ) : loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Searching…
              </div>
            ) : query.trim().length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">Type to search</p>
            ) : matches.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">No matches</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {matches.map((match, index) => (
                  <li key={`${match.filePath}-${match.line}-${index}`}>
                    <button
                      type="button"
                      className={cn(
                        'w-full rounded-md px-2 py-2 text-left text-sm transition-colors',
                        'hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                      )}
                      onClick={() => handleSelectResult(match.filePath)}
                    >
                      <div className="truncate font-medium text-foreground">
                        {basenameFromPath(match.filePath)}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        Line {match.line}: {match.lineText}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
