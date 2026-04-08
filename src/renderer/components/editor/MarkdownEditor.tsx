import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import type { Value } from 'platejs'
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  H4Plugin,
  H5Plugin,
  H6Plugin,
  HorizontalRulePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
} from '@platejs/basic-nodes/react'
import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from '@platejs/code-block/react'
import { LinkPlugin } from '@platejs/link/react'
import { ImagePlugin } from '@platejs/media/react'
import {
  BulletedListPlugin,
  ListItemPlugin,
  ListPlugin,
  NumberedListPlugin,
  TaskListPlugin,
} from '@platejs/list-classic/react'
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from '@platejs/table/react'
import { MarkdownPlugin } from '@platejs/markdown'
import { DndPlugin } from '@platejs/dnd'
import { Plate, PlateElement, usePlateEditor } from 'platejs/react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
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
import { Editor, EditorContainer } from '@/components/ui/editor'
import { FixedToolbar } from '@/components/ui/fixed-toolbar'
import { ToolbarButton, ToolbarGroup, ToolbarSeparator } from '@/components/ui/toolbar'
import { MarkToolbarButton } from '@/components/ui/mark-toolbar-button'
import { H1Element, H2Element, H3Element, H4Element, H5Element, H6Element } from '@/components/ui/heading-node'
import { BlockquoteElement } from '@/components/ui/blockquote-node'
import { ParagraphElement } from '@/components/ui/paragraph-node'
import { CodeBlockElement, CodeLineElement, CodeSyntaxLeaf } from '@/components/ui/code-block-node'
import { LinkElement } from '@/components/ui/link-node'
import { LinkFloatingToolbar } from '@/components/ui/link-toolbar'
import { ImageElement } from '@/components/ui/image-node'
import { HrElement } from '@/components/ui/hr-node'
import {
  BulletedListElement,
  ListItemElement,
  NumberedListElement,
  TaskListElement,
} from '@/components/ui/list-classic-node'
import { TableElement, TableCellElement, TableCellHeaderElement, TableRowElement } from '@/components/ui/table-node'

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

    const editor = usePlateEditor(
      {
        plugins: [
          // Marks
          BoldPlugin,
          ItalicPlugin,
          StrikethroughPlugin,
          CodePlugin,
          // Block elements
          H1Plugin.withComponent(H1Element),
          H2Plugin.withComponent(H2Element),
          H3Plugin.withComponent(H3Element),
          H4Plugin.withComponent(H4Element),
          H5Plugin.withComponent(H5Element),
          H6Plugin.withComponent(H6Element),
          BlockquotePlugin.withComponent(BlockquoteElement),
          HorizontalRulePlugin.withComponent(HrElement),
          // Code blocks
          CodeBlockPlugin.withComponent(CodeBlockElement),
          CodeLinePlugin.withComponent(CodeLineElement),
          CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),
          // Links
          LinkPlugin.configure({
            render: {
              node: LinkElement,
              afterEditable: () => <LinkFloatingToolbar />,
            },
          }),
          // Images
          ImagePlugin.withComponent(ImageElement),
          // Lists
          ListPlugin,
          BulletedListPlugin.withComponent(BulletedListElement),
          NumberedListPlugin.withComponent(NumberedListElement),
          TaskListPlugin.withComponent(TaskListElement),
          ListItemPlugin.withComponent(ListItemElement),
          // Tables
          TablePlugin.configure({
            node: { component: TableElement },
          }),
          TableRowPlugin.withComponent(TableRowElement),
          TableCellPlugin.withComponent(TableCellElement),
          TableCellHeaderPlugin.withComponent(TableCellHeaderElement),
          // Markdown serialization
          MarkdownPlugin,
          // DnD
          DndPlugin.configure({
            options: { enableScroller: true },
            render: {
              aboveSlate: ({ children }) => (
                <DndProvider backend={HTML5Backend}>{children}</DndProvider>
              ),
            },
          }),
        ],
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
      },
      [editor, markDirty]
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
