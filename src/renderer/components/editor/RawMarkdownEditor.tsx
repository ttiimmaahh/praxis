import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { useAppearanceStore } from '@/stores/appearance-store'
import { useDocumentIsDark } from '@/hooks/use-document-is-dark'

interface RawMarkdownEditorProps {
  filePath: string
  content: string
  onContentChange: (filePath: string, newContent: string) => void
}

export function RawMarkdownEditor({
  filePath,
  content,
  onContentChange
}: RawMarkdownEditorProps): React.JSX.Element {
  const isDark = useDocumentIsDark()
  const editorFontSizePx = useAppearanceStore((s) => s.editorFontSizePx)

  const extensions = useMemo(() => {
    const fontTheme = EditorView.theme({
      '.cm-content': { fontSize: `${editorFontSizePx}px` },
      '.cm-gutters': { fontSize: `${editorFontSizePx}px` },
      '.cm-lineNumbers .cm-gutterElement': { minWidth: '2.5ch' }
    })
    return [markdown(), EditorView.lineWrapping, fontTheme]
  }, [editorFontSizePx])

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <CodeMirror
        className="min-h-0 flex-1 [&_.cm-editor]:flex [&_.cm-editor]:min-h-0 [&_.cm-editor]:flex-1 [&_.cm-editor]:flex-col [&_.cm-scroller]:min-h-0 [&_.cm-scroller]:flex-1"
        value={content}
        height="100%"
        theme={isDark ? 'dark' : 'light'}
        extensions={extensions}
        basicSetup={{ lineNumbers: true, foldGutter: true, closeBrackets: true }}
        indentWithTab
        onChange={(value) => onContentChange(filePath, value)}
      />
    </div>
  )
}
