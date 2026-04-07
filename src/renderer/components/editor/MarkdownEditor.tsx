import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Crepe, CrepeFeature } from '@milkdown/crepe'
import { editorViewCtx } from '@milkdown/core'
import { Milkdown, MilkdownProvider, useEditor, useInstance } from '@milkdown/react'
import { TextSelection } from '@milkdown/kit/prose/state'
import { useWorkspaceStore } from '@/stores/workspace-store'

import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

export interface MarkdownEditorHandle {
  scrollToHeadingIndex: (headingIndex: number) => void
}

interface MarkdownEditorProps {
  filePath: string
  content: string
  onContentChange: (filePath: string, content: string) => void
}

const CrepeEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function CrepeEditor({ filePath, content, onContentChange }, ref) {
    const filePathRef = useRef(filePath)
    const markDirty = useWorkspaceStore((s) => s.markDirty)
    const onContentChangeRef = useRef(onContentChange)
    const initialContentRef = useRef(content)
    const [loading, getEditor] = useInstance()

    useEffect(() => {
      filePathRef.current = filePath
    }, [filePath])

    useEffect(() => {
      onContentChangeRef.current = onContentChange
    }, [onContentChange])

    useImperativeHandle(
      ref,
      () => ({
        scrollToHeadingIndex: (headingIndex: number) => {
          if (loading) return
          const editor = getEditor()
          if (!editor) return
          editor.action((ctx) => {
            const view = ctx.get(editorViewCtx)
            const state = view.state
            const headingPositions: number[] = []
            state.doc.descendants((node, pos) => {
              if (node.type.name === 'heading') {
                headingPositions.push(pos)
              }
            })
            const targetPos = headingPositions[headingIndex]
            if (targetPos === undefined) return
            const innerPos = Math.min(targetPos + 1, state.doc.content.size - 1)
            const resolved = state.doc.resolve(Math.max(1, innerPos))
            const tr = state.tr.setSelection(TextSelection.near(resolved, 1)).scrollIntoView()
            view.dispatch(tr)
            view.focus()
          })
        }
      }),
      [getEditor, loading]
    )

    useEditor((root) => {
      const crepe = new Crepe({
        root,
        defaultValue: initialContentRef.current,
        features: {
          [CrepeFeature.CodeMirror]: true,
          [CrepeFeature.ListItem]: true,
          [CrepeFeature.LinkTooltip]: true,
          [CrepeFeature.ImageBlock]: true,
          [CrepeFeature.BlockEdit]: true,
          [CrepeFeature.Toolbar]: true,
          [CrepeFeature.Placeholder]: true,
          [CrepeFeature.Table]: true,
          [CrepeFeature.Cursor]: true,
          [CrepeFeature.Latex]: false,
          [CrepeFeature.TopBar]: false
        },
        featureConfigs: {
          [CrepeFeature.Placeholder]: {
            text: 'Start writing...',
            mode: 'doc'
          }
        }
      })

      crepe.on((listener) => {
        listener.markdownUpdated((_ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown) {
            onContentChangeRef.current(filePathRef.current, markdown)
            markDirty(filePathRef.current, true)
          }
        })
      })

      return crepe
    }, [])

    return <Milkdown />
  }
)

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MarkdownEditor(props, ref) {
    return (
      <MilkdownProvider>
        <CrepeEditor {...props} ref={ref} />
      </MilkdownProvider>
    )
  }
)
