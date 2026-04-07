import { useEffect } from 'react'
import { applyAppearanceToDocument } from '@/lib/appearance'
import { useAppearanceStore } from '@/stores/appearance-store'

/** Re-apply theme when OS appearance changes while using system theme. */
export function useAppearanceSystemListener(): void {
  const themeMode = useAppearanceStore((s) => s.themeMode)

  useEffect(() => {
    if (themeMode !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (): void => {
      const state = useAppearanceStore.getState()
      applyAppearanceToDocument(state)
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [themeMode])
}
