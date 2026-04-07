import { useEffect, useRef, useCallback } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { useWorkspaceStore } from '@/stores/workspace-store'

interface MarkdownEditorProps {
  filePath: string
  content: string
  onContentChange: (filePath: string, content: string) => void
}

const cursorStateMap = new Map<string, { scrollTop: number; selection: { anchor: number; head: number } }>()

export function MarkdownEditor({
  filePath,
  content,
  onContentChange
}: MarkdownEditorProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const filePathRef = useRef(filePath)
  const markDirty = useWorkspaceStore((s) => s.markDirty)

  const handleChange = useCallback(
    (newContent: string) => {
      onContentChange(filePathRef.current, newContent)
      markDirty(filePathRef.current, true)
    },
    [onContentChange, markDirty]
  )

  useEffect(() => {
    filePathRef.current = filePath
  }, [filePath])

  useEffect(() => {
    if (!containerRef.current) return

    const savedState = cursorStateMap.get(filePath)

    const state = EditorState.create({
      doc: content,
      selection: savedState
        ? { anchor: savedState.selection.anchor, head: savedState.selection.head }
        : undefined,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        markdown({ codeLanguages: languages }),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            handleChange(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px'
          },
          '.cm-scroller': {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            lineHeight: '1.6',
            padding: '8px 0'
          },
          '.cm-content': {
            padding: '0 16px'
          },
          '.cm-gutters': {
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--muted-foreground)',
            paddingLeft: '8px'
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent'
          },
          '&.cm-focused .cm-cursor': {
            borderLeftColor: 'var(--foreground)'
          },
          '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
            backgroundColor: 'var(--accent) !important'
          }
        }),
        EditorView.lineWrapping
      ]
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    if (savedState) {
      requestAnimationFrame(() => {
        view.scrollDOM.scrollTop = savedState.scrollTop
      })
    }

    return () => {
      const currentView = viewRef.current
      if (currentView) {
        const selection = currentView.state.selection.main
        cursorStateMap.set(filePath, {
          scrollTop: currentView.scrollDOM.scrollTop,
          selection: { anchor: selection.anchor, head: selection.head }
        })
        currentView.destroy()
        viewRef.current = null
      }
    }
  }, [filePath, content, handleChange])

  return <div ref={containerRef} className="h-full w-full overflow-hidden" />
}
