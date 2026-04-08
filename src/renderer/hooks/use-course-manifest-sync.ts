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
  // (skipped when a course was just scaffolded — creator should land in edit mode)
  useEffect(() => {
    const unsubscribe = useCourseStore.subscribe((state, prev) => {
      if (state.status === 'ready' && prev.status !== 'ready' && state.manifest) {
        const ws = useWorkspaceStore.getState()
        if (ws.suppressLearnerAutoEnter) {
          ws.setSuppressLearnerAutoEnter(false)
          return
        }
        const learner = useLearnerStore.getState()
        if (!learner.active && ws.rootPath) {
          void learner.enter(state.manifest, ws.rootPath)
        }
      }
    })
    return unsubscribe
  }, [])
}
