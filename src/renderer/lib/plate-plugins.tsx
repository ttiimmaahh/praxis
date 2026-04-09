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
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { H1Element, H2Element, H3Element, H4Element, H5Element, H6Element } from '@/components/ui/heading-node'
import { BlockquoteElement } from '@/components/ui/blockquote-node'
import {
  CodeBlockElement,
  CodeBlockElementStatic,
  CodeLineElement,
  CodeSyntaxLeaf,
} from '@/components/ui/code-block-node'
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
import {
  TableElement,
  TableCellElement,
  TableCellHeaderElement,
  TableRowElement,
} from '@/components/ui/table-node'

/**
 * Shared Plate plugin list used by:
 * - The live editor (`MarkdownEditor` → `usePlateEditor`)
 * - The headless export renderer (`renderMarkdownToHtml` → `createPlateEditor` + `serializeHtml`)
 *
 * Keeping these in one place guarantees exported HTML matches what users see in the editor.
 *
 * @param options.includeDnd — set to `false` for headless rendering contexts where DnD scaffolding
 *   is edit-time-only and would just add noise to static HTML. Defaults to `true`.
 * @param options.exportMode — set to `true` for headless export rendering. Swaps components that
 *   contain edit-time UI chrome (e.g. code block language combobox, link floating toolbar) for
 *   minimal static variants, and drops hook-based components entirely since `renderToStaticMarkup`
 *   in a rebuild loop crashes with "Invalid hook call" on stateful elements. Defaults to `false`.
 */
const DndPluginConfigured = DndPlugin.configure({
  options: { enableScroller: true },
  render: {
    aboveSlate: ({ children }) => <DndProvider backend={HTML5Backend}>{children}</DndProvider>,
  },
})

export function getSharedPlatePlugins(
  options: { includeDnd?: boolean; exportMode?: boolean } = {}
) {
  const { includeDnd = true, exportMode = false } = options

  // Pick the right code block element: static (no toolbar, no hooks) for
  // export, or the full editor-time component otherwise.
  const codeBlockComponent = exportMode ? CodeBlockElementStatic : CodeBlockElement

  // Link plugin: in export mode, drop the `afterEditable` floating toolbar so
  // we don't pull in hook-based popover machinery during static rendering.
  const linkPluginConfigured = exportMode
    ? LinkPlugin.configure({
        render: { node: LinkElement },
      })
    : LinkPlugin.configure({
        render: {
          node: LinkElement,
          afterEditable: () => <LinkFloatingToolbar />,
        },
      })

  return [
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
    CodeBlockPlugin.withComponent(codeBlockComponent),
    CodeLinePlugin.withComponent(CodeLineElement),
    CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),
    // Links
    linkPluginConfigured,
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
    // DnD (edit-time only) — conditionally included via spread
    ...(includeDnd ? [DndPluginConfigured] : []),
  ]
}
