import { useEffect } from 'react'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useCourseStore } from '@/stores/course-store'
import { useLearnerStore } from '@/stores/learner-store'

/** Loads `course.yaml` when the workspace root changes or the file watcher reports changes. `EditorArea` also reloads after a successful save when the manifest or a lesson file changes. */
export function useCourseManifestSync(): void {
  const rootPath = useWorkspaceStore((s) => s.rootPath)
  const loadForRoot = useCourseStore((s) => s.loadForRoot)

  useEffect(() => {
    void loadForRoot(rootPath)
  }, [rootPath, loadForRoot])

  useEffect(() => {
    if (!rootPath) return
    const unsubscribe = window.electronAPI.onFileSystemChange(() => {
      void loadForRoot(rootPath)
    })
    return unsubscribe
  }, [rootPath, loadForRoot])

  // Auto-enter learner mode when a course manifest becomes ready
  useEffect(() => {
    const unsubscribe = useCourseStore.subscribe((state, prev) => {
      if (state.status === 'ready' && prev.status !== 'ready' && state.manifest) {
        const learner = useLearnerStore.getState()
        if (!learner.active) {
          const root = useWorkspaceStore.getState().rootPath
          if (root) {
            void learner.enter(state.manifest, root)
          }
        }
      }
    })
    return unsubscribe
  }, [])
}
