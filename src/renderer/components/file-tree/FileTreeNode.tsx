import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ChevronRight,
  ChevronDown,
  File,
  FileText,
  FileCode,
  FileJson,
  Folder,
  FolderOpen
} from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FileTreeNodeProps {
  entry: FileEntry
  depth: number
  activeFilePath: string | null
  onFileSelect: (filePath: string, fileName: string) => void
  onCreateFile: (parentPath: string) => void
  onCreateDirectory: (parentPath: string) => void
  onRename: (oldPath: string, newName: string) => void
  onDelete: (entryPath: string, name: string) => void
}

function getFileIcon(extension: string): React.ReactNode {
  const iconClass = 'h-4 w-4 shrink-0'
  switch (extension) {
    case '.md':
    case '.mdx':
    case '.txt':
      return <FileText className={cn(iconClass, 'text-blue-400')} />
    case '.ts':
    case '.tsx':
    case '.js':
    case '.jsx':
      return <FileCode className={cn(iconClass, 'text-yellow-400')} />
    case '.json':
      return <FileJson className={cn(iconClass, 'text-green-400')} />
    case '.yaml':
    case '.yml':
      return <FileCode className={cn(iconClass, 'text-orange-400')} />
    default:
      return <File className={iconClass} />
  }
}

export function FileTreeNode({
  entry,
  depth,
  activeFilePath,
  onFileSelect,
  onCreateFile,
  onCreateDirectory,
  onRename,
  onDelete
}: FileTreeNodeProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const [children, setChildren] = useState<FileEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(entry.name)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const loadChildren = useCallback(async () => {
    if (!entry.isDirectory) return
    setIsLoading(true)
    try {
      const entries = await window.electronAPI.readDirectory(entry.path)
      setChildren(entries)
    } catch (error) {
      console.error('Failed to read directory:', error)
    } finally {
      setIsLoading(false)
    }
  }, [entry.path, entry.isDirectory])

  const handleToggle = useCallback(async () => {
    if (!entry.isDirectory) return
    const nextExpanded = !isExpanded
    setIsExpanded(nextExpanded)
    if (nextExpanded) {
      await loadChildren()
    }
  }, [entry.isDirectory, isExpanded, loadChildren])

  const handleClick = useCallback(() => {
    if (entry.isDirectory) {
      handleToggle()
    } else {
      onFileSelect(entry.path, entry.name)
    }
  }, [entry, handleToggle, onFileSelect])

  const startRename = useCallback(() => {
    setRenameValue(entry.name)
    setIsRenaming(true)
  }, [entry.name])

  const commitRename = useCallback(() => {
    setIsRenaming(false)
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== entry.name) {
      onRename(entry.path, trimmed)
    }
  }, [renameValue, entry.name, entry.path, onRename])

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
      const dotIndex = renameValue.lastIndexOf('.')
      renameInputRef.current.setSelectionRange(0, dotIndex > 0 ? dotIndex : renameValue.length)
    }
  }, [isRenaming, renameValue])

  const isActive = !entry.isDirectory && entry.path === activeFilePath

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-1 rounded-sm px-1 py-0.5 text-left text-sm',
              'hover:bg-accent/50 transition-colors',
              isActive && 'bg-accent text-accent-foreground'
            )}
            style={{ paddingLeft: `${depth * 16 + 4}px` }}
            onClick={handleClick}
          >
            {entry.isDirectory ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 shrink-0 text-amber-400" />
                ) : (
                  <Folder className="h-4 w-4 shrink-0 text-amber-400" />
                )}
              </>
            ) : (
              <>
                <span className="w-3.5 shrink-0" />
                {getFileIcon(entry.extension)}
              </>
            )}

            {isRenaming ? (
              <Input
                ref={renameInputRef}
                className="h-5 flex-1 rounded-none border-0 bg-background px-1 py-0 text-sm focus-visible:ring-1"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') setIsRenaming(false)
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="min-w-0 flex-1 truncate">{entry.name}</span>
            )}
          </button>
        </ContextMenuTrigger>

        <ContextMenuContent>
          {entry.isDirectory && (
            <>
              <ContextMenuItem onClick={() => onCreateFile(entry.path)}>
                New File
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onCreateDirectory(entry.path)}>
                New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={startRename}>Rename</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(entry.path, entry.name)}
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {entry.isDirectory && isExpanded && !isLoading && (
        <div>
          {children.map((child) => (
            <FileTreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              activeFilePath={activeFilePath}
              onFileSelect={onFileSelect}
              onCreateFile={onCreateFile}
              onCreateDirectory={onCreateDirectory}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
          {children.length === 0 && (
            <div
              className="py-0.5 text-xs text-muted-foreground/50"
              style={{ paddingLeft: `${(depth + 1) * 16 + 4}px` }}
            >
              Empty
            </div>
          )}
        </div>
      )}
    </div>
  )
}
