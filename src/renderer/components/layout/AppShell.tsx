import { useRef, useCallback, useState } from 'react'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { EditorArea } from './EditorArea'

const MIN_SIDEBAR_WIDTH = 180
const MAX_SIDEBAR_WIDTH = 480
const DEFAULT_SIDEBAR_WIDTH = 260

export function AppShell(): React.JSX.Element {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      if (!isDragging.current || !containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = moveEvent.clientX - containerRect.left
      const clamped = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth))
      setSidebarWidth(clamped)
    }

    const handleMouseUp = (): void => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <TitleBar />

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        <div className="shrink-0 overflow-hidden" style={{ width: sidebarWidth }}>
          <Sidebar />
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          className="w-px shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/30 active:bg-primary/40"
          style={{ touchAction: 'none' }}
          onMouseDown={handleMouseDown}
        >
          <div className="relative h-full w-3 -translate-x-1/2" />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <EditorArea />
        </div>
      </div>
    </div>
  )
}
