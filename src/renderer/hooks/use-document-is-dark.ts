import { useSyncExternalStore } from 'react'

/** Tracks `document.documentElement.classList.contains('dark')` (set by appearance). */
export function useDocumentIsDark(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const observer = new MutationObserver(() => onStoreChange())
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      })
      return () => observer.disconnect()
    },
    () => document.documentElement.classList.contains('dark'),
    () => false
  )
}
