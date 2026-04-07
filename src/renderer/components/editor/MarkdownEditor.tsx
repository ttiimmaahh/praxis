import { useEffect, useRef } from 'react'
import { Crepe, CrepeFeature } from '@milkdown/crepe'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { useWorkspaceStore } from '@/stores/workspace-store'

import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

interface MarkdownEditorProps {
  filePath: string
  content: string
  onContentChange: (filePath: string, content: string) => void
}

function CrepeEditor({
  filePath,
  content,
  onContentChange
}: MarkdownEditorProps): React.JSX.Element {
  const filePathRef = useRef(filePath)
  const markDirty = useWorkspaceStore((s) => s.markDirty)
  const onContentChangeRef = useRef(onContentChange)
  const initialContentRef = useRef(content)

  useEffect(() => {
    filePathRef.current = filePath
  }, [filePath])

  useEffect(() => {
    onContentChangeRef.current = onContentChange
  }, [onContentChange])

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

export function MarkdownEditor(props: MarkdownEditorProps): React.JSX.Element {
  return (
    <MilkdownProvider>
      <CrepeEditor {...props} />
    </MilkdownProvider>
  )
}
