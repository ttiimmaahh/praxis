import { useState, useEffect, useCallback } from 'react'
import { FileTreeNode } from './FileTreeNode'
import { useWorkspaceStore } from '@/stores/workspace-store'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

export function FileTree(): React.JSX.Element {
  const rootPath = useWorkspaceStore((s) => s.rootPath)
  const activeTabPath = useWorkspaceStore((s) => s.activeTabPath)
  const openFile = useWorkspaceStore((s) => s.openFile)
  const [rootEntries, setRootEntries] = useState<FileEntry[]>([])
  const [deleteTarget, setDeleteTarget] = useState<{ path: string; name: string } | null>(null)

  const loadRootEntries = useCallback(async () => {
    if (!rootPath) return
    try {
      const entries = await window.electronAPI.readDirectory(rootPath)
      setRootEntries(entries)
    } catch (error) {
      console.error('Failed to load root directory:', error)
    }
  }, [rootPath])

  useEffect(() => {
    loadRootEntries()
  }, [loadRootEntries])

  useEffect(() => {
    if (!rootPath) return
    const unsubscribe = window.electronAPI.onFileSystemChange(() => {
      loadRootEntries()
    })
    return unsubscribe
  }, [rootPath, loadRootEntries])

  const handleFileSelect = useCallback(
    (filePath: string, fileName: string) => {
      openFile(filePath, fileName)
    },
    [openFile]
  )

  const handleCreateFile = useCallback(
    async (parentPath: string) => {
      const name = `untitled-${Date.now()}.md`
      try {
        const filePath = await window.electronAPI.createFile(parentPath, name)
        await loadRootEntries()
        openFile(filePath, name)
      } catch (error) {
        console.error('Failed to create file:', error)
      }
    },
    [loadRootEntries, openFile]
  )

  const handleCreateDirectory = useCallback(
    async (parentPath: string) => {
      const name = `new-folder-${Date.now()}`
      try {
        await window.electronAPI.createDirectory(parentPath, name)
        await loadRootEntries()
      } catch (error) {
        console.error('Failed to create directory:', error)
      }
    },
    [loadRootEntries]
  )

  const handleRename = useCallback(
    async (oldPath: string, newName: string) => {
      try {
        await window.electronAPI.rename(oldPath, newName)
        await loadRootEntries()
      } catch (error) {
        console.error('Failed to rename:', error)
      }
    },
    [loadRootEntries]
  )

  const handleDeleteRequest = useCallback((entryPath: string, name: string) => {
    setDeleteTarget({ path: entryPath, name })
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await window.electronAPI.delete(deleteTarget.path)
      await loadRootEntries()
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setDeleteTarget(null)
    }
  }, [deleteTarget, loadRootEntries])

  if (rootEntries.length === 0) {
    return <div className="px-4 py-2 text-xs text-muted-foreground/50">No files</div>
  }

  return (
    <>
      <div className="py-1">
        {rootEntries.map((entry) => (
          <FileTreeNode
            key={entry.path}
            entry={entry}
            depth={0}
            activeFilePath={activeTabPath}
            onFileSelect={handleFileSelect}
            onCreateFile={handleCreateFile}
            onCreateDirectory={handleCreateDirectory}
            onRename={handleRename}
            onDelete={handleDeleteRequest}
          />
        ))}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The item will be permanently deleted from disk.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
