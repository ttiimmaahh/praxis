import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createPlateEditor } from 'platejs/react'
import { PlateStatic } from 'platejs/static'
import { MarkdownPlugin } from '@platejs/markdown'

import { getSharedPlatePlugins } from '@/lib/plate-plugins'

/**
 * Matches a leading YAML frontmatter block: `---\n...\n---\n` at the very start
 * of the file. Plate's MarkdownPlugin has no frontmatter awareness and would
 * otherwise render these fields as a paragraph of body text in exports.
 */
const FRONTMATTER_RX = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/

/**
 * Render a Markdown string to HTML using the same Plate plugin pipeline as the
 * live editor, so exported output matches what users see in the editor.
 *
 * Pipeline: markdown → Plate value (via MarkdownPlugin.deserialize) → HTML
 * (via `renderToStaticMarkup(<PlateStatic>)`).
 *
 * DnD is excluded from the plugin list for export since it's edit-time-only
 * scaffolding that would add irrelevant wrappers to the static output. YAML
 * frontmatter is stripped before deserialization since Plate has no frontmatter
 * awareness. Edit-time UI chrome (code block toolbar, link floating toolbar)
 * is swapped for static variants via `exportMode: true`.
 *
 * **Why not `serializeHtml` from `platejs/static`?** `serializeHtml` does
 * `await import('react-dom/server')`, which Vite code-splits into a separate
 * chunk. The split chunk ends up with a different React instance than the
 * main bundle, and stateful Plate components (anything calling hooks like
 * `useReadOnly`) crash with "Invalid hook call" in the rebuild loop used for
 * course export. Statically importing `renderToStaticMarkup` here pins it to
 * the main bundle's React, which shares the dispatcher cleanly.
 *
 * @returns The raw HTML string for the content body (no `<html>`/`<head>` wrapper).
 *   The main process adds the document shell + CSS.
 */
export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  const stripped = markdown.replace(FRONTMATTER_RX, '')

  const editor = createPlateEditor({
    plugins: getSharedPlatePlugins({ includeDnd: false, exportMode: true })
  })

  const value = editor.getApi(MarkdownPlugin).markdown.deserialize(stripped)
  editor.children = value
  // Ensure Plate's internal selection / normalization state is consistent after
  // swapping children directly. PlateStatic only reads `editor.children`, so
  // this is sufficient for the rendering path.

  return renderToStaticMarkup(createElement(PlateStatic, { editor }))
}
