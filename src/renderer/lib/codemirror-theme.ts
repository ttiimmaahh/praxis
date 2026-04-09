import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import type { Extension } from '@codemirror/state'

/**
 * App-integrated CodeMirror theme that uses CSS custom properties from globals.css.
 * Replaces the built-in light/dark themes so the editor background, gutters, and
 * selections all match the rest of the app.
 */
export function appEditorTheme(fontSizePx: number): Extension {
  const baseTheme = EditorView.theme({
    '&': {
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)'
    },
    '.cm-content': {
      fontSize: `${fontSizePx}px`,
      caretColor: 'var(--foreground)'
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--foreground)'
    },
    '.cm-gutters': {
      backgroundColor: 'var(--background)',
      color: 'var(--muted-foreground)',
      fontSize: `${fontSizePx}px`,
      borderRight: '1px solid var(--border)'
    },
    '.cm-lineNumbers .cm-gutterElement': {
      minWidth: '2.5ch'
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--muted)'
    },
    '.cm-activeLine': {
      backgroundColor: 'color-mix(in oklch, var(--muted), transparent 50%)'
    },
    '.cm-selectionBackground': {
      backgroundColor: 'var(--muted) !important'
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: 'color-mix(in oklch, var(--ring), transparent 70%) !important'
    },
    '.cm-foldGutter .cm-gutterElement': {
      color: 'var(--muted-foreground)'
    }
  })

  const highlightStyle = syntaxHighlighting(
    HighlightStyle.define([
      // Keys / property names -- soft teal
      { tag: tags.propertyName, color: '#7dcfcf' },
      { tag: tags.definition(tags.propertyName), color: '#7dcfcf' },

      // Strings -- warm muted green
      { tag: tags.string, color: '#a8cc8c' },

      // Numbers -- soft orange
      { tag: tags.number, color: '#dbab79' },

      // Booleans / special constants -- muted purple
      { tag: tags.bool, color: '#c4a0e8' },
      { tag: tags.null, color: '#c4a0e8' },
      { tag: tags.atom, color: '#c4a0e8' },

      // Comments -- dimmed
      { tag: tags.comment, color: 'var(--muted-foreground)', fontStyle: 'italic' },
      { tag: tags.lineComment, color: 'var(--muted-foreground)', fontStyle: 'italic' },

      // Headings (markdown)
      { tag: tags.heading1, color: '#e0af68', fontWeight: 'bold' },
      { tag: tags.heading2, color: '#e0af68', fontWeight: 'bold' },
      { tag: tags.heading3, color: '#e0af68', fontWeight: 'bold' },
      { tag: tags.heading, color: '#e0af68', fontWeight: 'bold' },

      // Emphasis (markdown)
      { tag: tags.emphasis, fontStyle: 'italic', color: '#c0caf5' },
      { tag: tags.strong, fontWeight: 'bold', color: '#c0caf5' },

      // Links (markdown)
      { tag: tags.link, color: '#7dcfcf', textDecoration: 'underline' },
      { tag: tags.url, color: '#7dcfcf' },

      // Code / inline code (markdown)
      { tag: tags.monospace, color: '#a8cc8c' },

      // Punctuation -- subdued
      { tag: tags.punctuation, color: 'var(--muted-foreground)' },
      { tag: tags.separator, color: 'var(--muted-foreground)' },
      { tag: tags.bracket, color: 'var(--muted-foreground)' },

      // Keywords / operators
      { tag: tags.keyword, color: '#c4a0e8' },
      { tag: tags.operator, color: 'var(--muted-foreground)' },

      // Tags (YAML anchors, etc.)
      { tag: tags.tagName, color: '#7dcfcf' },
      { tag: tags.attributeName, color: '#7dcfcf' },
      { tag: tags.attributeValue, color: '#a8cc8c' },

      // Meta / processing instructions
      { tag: tags.meta, color: 'var(--muted-foreground)' },

      // Fallback for names
      { tag: tags.name, color: '#c0caf5' },
      { tag: tags.variableName, color: '#c0caf5' }
    ])
  )

  return [baseTheme, highlightStyle]
}
