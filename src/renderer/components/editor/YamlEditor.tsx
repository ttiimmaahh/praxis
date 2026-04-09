import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { yaml } from '@codemirror/lang-yaml'
import { EditorView } from '@codemirror/view'
import { useAppearanceStore } from '@/stores/appearance-store'
import { appEditorTheme } from '@/lib/codemirror-theme'

export interface YamlEditorProps {
  filePath: string
  content: string
  onContentChange: (filePath: string, newContent: string) => void
}

export function YamlEditor({
  filePath,
  content,
  onContentChange
}: YamlEditorProps): React.JSX.Element {
  const editorFontSizePx = useAppearanceStore((s) => s.editorFontSizePx)

  const extensions = useMemo(
    () => [yaml(), EditorView.lineWrapping, appEditorTheme(editorFontSizePx)],
    [editorFontSizePx]
  )

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <CodeMirror
        className="min-h-0 flex-1 [&_.cm-editor]:flex [&_.cm-editor]:min-h-0 [&_.cm-editor]:flex-1 [&_.cm-editor]:flex-col [&_.cm-scroller]:min-h-0 [&_.cm-scroller]:flex-1"
        value={content}
        height="100%"
        theme="none"
        extensions={extensions}
        basicSetup={{ lineNumbers: true, foldGutter: true, closeBrackets: true }}
        indentWithTab
        onChange={(value) => onContentChange(filePath, value)}
      />
    </div>
  )
}
