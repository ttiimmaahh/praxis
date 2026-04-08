import { useRef } from 'react'
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
import { Plate, usePlateEditor } from 'platejs/react'
import { Editor, EditorContainer } from '@/components/ui/editor'
import { H1Element, H2Element, H3Element, H4Element, H5Element, H6Element } from '@/components/ui/heading-node'
import { BlockquoteElement } from '@/components/ui/blockquote-node'
import { CodeBlockElement, CodeLineElement, CodeSyntaxLeaf } from '@/components/ui/code-block-node'
import { LinkElement } from '@/components/ui/link-node'
import { ImageElement } from '@/components/ui/image-node'
import { HrElement } from '@/components/ui/hr-node'
import {
  BulletedListElement,
  ListItemElement,
  NumberedListElement,
  TaskListElement,
} from '@/components/ui/list-classic-node'
import { TableElement, TableCellElement, TableCellHeaderElement, TableRowElement } from '@/components/ui/table-node'

interface LessonReaderProps {
  content: string
}

export function LessonReader({ content }: LessonReaderProps): React.JSX.Element {
  const contentRef = useRef(content)

  const editor = usePlateEditor(
    {
      plugins: [
        BoldPlugin,
        ItalicPlugin,
        StrikethroughPlugin,
        CodePlugin,
        H1Plugin.withComponent(H1Element),
        H2Plugin.withComponent(H2Element),
        H3Plugin.withComponent(H3Element),
        H4Plugin.withComponent(H4Element),
        H5Plugin.withComponent(H5Element),
        H6Plugin.withComponent(H6Element),
        BlockquotePlugin.withComponent(BlockquoteElement),
        HorizontalRulePlugin.withComponent(HrElement),
        CodeBlockPlugin.withComponent(CodeBlockElement),
        CodeLinePlugin.withComponent(CodeLineElement),
        CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),
        LinkPlugin.withComponent(LinkElement),
        ImagePlugin.withComponent(ImageElement),
        ListPlugin,
        BulletedListPlugin.withComponent(BulletedListElement),
        NumberedListPlugin.withComponent(NumberedListElement),
        TaskListPlugin.withComponent(TaskListElement),
        ListItemPlugin.withComponent(ListItemElement),
        TablePlugin.configure({ node: { component: TableElement } }),
        TableRowPlugin.withComponent(TableRowElement),
        TableCellPlugin.withComponent(TableCellElement),
        TableCellHeaderPlugin.withComponent(TableCellHeaderElement),
        MarkdownPlugin,
      ],
      value: (editor) => editor.getApi(MarkdownPlugin).markdown.deserialize(contentRef.current),
    },
    []
  )

  return (
    <Plate editor={editor} readOnly>
      <EditorContainer>
        <Editor variant="fullWidth" />
      </EditorContainer>
    </Plate>
  )
}
