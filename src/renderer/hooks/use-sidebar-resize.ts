import { useCallback, useEffect, useRef } from 'react'

export interface UseSidebarResizeOptions {
  currentWidth: number
  minWidth?: number
  maxWidth?: number
  onResize: (width: number) => void
  onToggle: () => void
  isCollapsed: boolean
  autoCollapseThreshold?: number
}

export function useSidebarResize({
  currentWidth,
  minWidth = 180,
  maxWidth = 480,
  onResize,
  onToggle,
  isCollapsed,
  autoCollapseThreshold = 0.6
}: UseSidebarResizeOptions) {
  const dragRef = useRef<HTMLButtonElement>(null)
  const isDragging = useRef(false)
  const isInteracting = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)
  const rafId = useRef(0)
  const wrapperRef = useRef<HTMLElement | null>(null)

  const getWrapper = useCallback((): HTMLElement | null => {
    if (!wrapperRef.current) {
      wrapperRef.current = document.querySelector('[data-slot="sidebar-wrapper"]')
    }
    return wrapperRef.current
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isCollapsed) {
        onToggle()
        return
      }

      e.preventDefault()
      isInteracting.current = true
      isDragging.current = false
      startX.current = e.clientX
      startWidth.current = currentWidth
    },
    [isCollapsed, onToggle, currentWidth]
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      if (!isInteracting.current) return

      const deltaX = e.clientX - startX.current
      if (!isDragging.current && Math.abs(deltaX) > 3) {
        isDragging.current = true
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
        const wrapper = getWrapper()
        if (wrapper) wrapper.dataset.dragging = ''
      }

      if (!isDragging.current) return

      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(() => {
        const wrapper = getWrapper()
        if (!wrapper) return

        const insetPadding = 8
        const rawWidth = e.clientX - insetPadding
        const clamped = Math.max(minWidth, Math.min(maxWidth, rawWidth))

        if (clamped <= minWidth * autoCollapseThreshold) {
          onToggle()
          cleanup()
          return
        }

        wrapper.style.setProperty('--sidebar-width', `${clamped}px`)
      })
    }

    const cleanup = (): void => {
      cancelAnimationFrame(rafId.current)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      const wrapper = getWrapper()
      if (wrapper) delete wrapper.dataset.dragging
    }

    const handleMouseUp = (e: MouseEvent): void => {
      if (!isInteracting.current) return

      if (!isDragging.current) {
        onToggle()
        isInteracting.current = false
        return
      }

      const wrapper = getWrapper()
      if (wrapper) {
        const insetPadding = 8
        const rawWidth = e.clientX - insetPadding
        const finalWidth = Math.max(minWidth, Math.min(maxWidth, rawWidth))
        wrapper.style.setProperty('--sidebar-width', `${finalWidth}px`)
        onResize(finalWidth)
      }

      cleanup()
      isDragging.current = false
      isInteracting.current = false
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      cancelAnimationFrame(rafId.current)
    }
  }, [getWrapper, minWidth, maxWidth, autoCollapseThreshold, onResize, onToggle])

  return { dragRef, handleMouseDown }
}
