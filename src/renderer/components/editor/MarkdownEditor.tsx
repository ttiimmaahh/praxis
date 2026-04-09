import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import type { Value } from 'platejs'
import { MarkdownPlugin } from '@platejs/markdown'
import { Plate, usePlateEditor } from 'platejs/react'
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Table,
} from 'lucide-react'

import { useWorkspaceStore } from '@/stores/workspace-store'
import { getSharedPlatePlugins } from '@/lib/plate-plugins'
import { Editor, EditorContainer } from '@/components/ui/editor'
import { FixedToolbar } from '@/components/ui/fixed-toolbar'
import { ToolbarButton, ToolbarGroup } from '@/components/ui/toolbar'
import { MarkToolbarButton } from '@/components/ui/mark-toolbar-button'

export interface MarkdownEditorHandle {
  scrollToHeadingIndex: (headingIndex: number) => void
}

interface MarkdownEditorProps {
  filePath: string
  content: string
  onContentChange: (filePath: string, content: string) => void
}

const HEADING_TYPES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MarkdownEditor({ filePath, content, onContentChange }, ref) {
    const filePathRef = useRef(filePath)
    filePathRef.current = filePath
    const onContentChangeRef = useRef(onContentChange)
    onContentChangeRef.current = onContentChange
    const markDirty = useWorkspaceStore((s) => s.markDirty)
    const setLiveMarkdown = useWorkspaceStore((s) => s.setLiveMarkdown)

    const editor = usePlateEditor(
      {
        plugins: getSharedPlatePlugins(),
        value: (editor) => editor.getApi(MarkdownPlugin).markdown.deserialize(content),
      },
      [content]
    )

    useImperativeHandle(
      ref,
      () => ({
        scrollToHeadingIndex: (headingIndex: number) => {
          const headings = Array.from(
            editor.api.nodes({
              at: [],
              match: (n) => HEADING_TYPES.includes((n as { type?: string }).type ?? ''),
            })
          )
          const target = headings[headingIndex]
          if (!target) return
          const [, path] = target
          // Select the heading and scroll into view
          editor.tf.select(path)
          // Use setTimeout to let React render the selection, then scroll
          setTimeout(() => {
            try {
              const domNode = editor.api.toDOMNode(target[0])
              if (domNode) {
                domNode.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            } catch {
              // fallback: just focus
            }
            editor.tf.focus()
          }, 0)
        },
      }),
      [editor]
    )

    const handleChange = useCallback(
      ({ value }: { value: Value }) => {
        const md = editor.getApi(MarkdownPlugin).markdown.serialize({ value })
        onContentChangeRef.current(filePathRef.current, md)
        markDirty(filePathRef.current, true)
        setLiveMarkdown(filePathRef.current, md)
      },
      [editor, markDirty, setLiveMarkdown]
    )

    return (
      <Plate editor={editor} onChange={handleChange}>
        <FixedToolbar className="flex justify-start gap-0.5 rounded-none border-b border-border/50 bg-muted/20 px-2">
          <ToolbarGroup>
            <ToolbarButton onClick={() => editor.tf.h1.toggle()} tooltip="Heading 1">
              <Heading1 />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.tf.h2.toggle()} tooltip="Heading 2">
              <Heading2 />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.tf.h3.toggle()} tooltip="Heading 3">
              <Heading3 />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘B)">
              <Bold />
            </MarkToolbarButton>
            <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘I)">
              <Italic />
            </MarkToolbarButton>
            <MarkToolbarButton nodeType="strikethrough" tooltip="Strikethrough">
              <Strikethrough />
            </MarkToolbarButton>
            <MarkToolbarButton nodeType="code" tooltip="Inline Code">
              <Code />
            </MarkToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <ToolbarButton onClick={() => editor.tf.bulleted_list.toggle()} tooltip="Bullet List">
              <List />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.tf.numbered_list.toggle()} tooltip="Ordered List">
              <ListOrdered />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.tf.task_list.toggle()} tooltip="Task List">
              <ListChecks />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <ToolbarButton onClick={() => editor.tf.link.insert()} tooltip="Link">
              <Link />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.tf.insertNodes({
                  type: 'img',
                  url: '',
                  children: [{ text: '' }],
                })
              }
              tooltip="Image"
            >
              <Image />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.tf.insertNodes({ type: 'table', children: [] })}
              tooltip="Table"
            >
              <Table />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <ToolbarButton
              onClick={() =>
                editor.tf.insertNodes({
                  type: 'code_block',
                  children: [{ type: 'code_line', children: [{ text: '' }] }],
                })
              }
              tooltip="Code Block"
            >
              <Code2 />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.tf.blockquote.toggle()} tooltip="Blockquote">
              <Quote />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.tf.insertNodes({
                  type: 'hr',
                  children: [{ text: '' }],
                })
              }
              tooltip="Horizontal Rule"
            >
              <Minus />
            </ToolbarButton>
          </ToolbarGroup>
        </FixedToolbar>

        <EditorContainer>
          <Editor placeholder="Start writing..." variant="fullWidth" />
        </EditorContainer>
      </Plate>
    )
  }
)
