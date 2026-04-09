/**
 * Main-process export pipeline: shell builder, image inliner, offscreen-window
 * PDF renderer, and file-writing helpers. The renderer hands us already-rendered
 * HTML body strings (via Plate's serializeHtml); this module wraps them in a
 * full document, inlines local images, and writes them to disk or PDF.
 */

import { BrowserWindow, dialog } from 'electron'
import { promises as fs } from 'fs'
import { dirname, extname, isAbsolute, join, resolve as resolvePath } from 'path'
import { pathToFileURL, fileURLToPath } from 'url'

import { EXPORT_CSS } from './export-css'

/* ─────────────────────────────── types ─────────────────────────────── */

export interface BuildShellOptions {
  title: string
  theme: ExportTheme
  bodyInnerHtml: string
  /** Optional extra markup injected inside <body> before the .praxis-export wrapper (e.g. cover page). */
  prefix?: string
  /** Replace the default .praxis-export wrapper entirely (used by course-html bundle). */
  customWrapper?: (inner: string) => string
}

export interface PdfRenderOptions {
  pageSize: ExportPageSize
  orientation: ExportOrientation
  /**
   * Title shown in the PDF footer center slot. Left blank to omit.
   * Typically the document or course title.
   */
  footerTitle?: string
}

/* ─────────────────────────── document shell ───────────────────────── */

/**
 * Wrap an HTML body fragment in a self-contained HTML5 document with inlined CSS.
 * Used for single-doc HTML/PDF and single-file course PDF. The `praxis-export`
 * wrapper applies typography; adding `.dark` switches color tokens.
 */
export function buildExportDocumentShell(options: BuildShellOptions): string {
  const { title, theme, bodyInnerHtml, prefix = '', customWrapper } = options
  const themeClass = theme === 'dark' ? 'praxis-export dark' : 'praxis-export'
  const safeTitle = escapeHtml(title)

  const body = customWrapper
    ? customWrapper(bodyInnerHtml)
    : `<div class="${themeClass}">${bodyInnerHtml}</div>`

  return `<!DOCTYPE html>
<html lang="en" class="${theme === 'dark' ? 'dark' : ''}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<style>${EXPORT_CSS}</style>
</head>
<body class="${theme === 'dark' ? 'dark' : ''}">
${prefix}
${body}
</body>
</html>`
}

/* ─────────────────────────── image inlining ───────────────────────── */

const DATA_URI_RX = /^data:/i
const REMOTE_URI_RX = /^(https?:)?\/\//i
const IMG_SRC_RX = /<img\b[^>]*?\bsrc\s*=\s*(["'])(.*?)\1[^>]*>/gi

/**
 * Replace local `<img src="...">` references with base64 data URIs so the
 * exported HTML/PDF is self-contained. Remote (http/https) and existing
 * `data:` URIs are left alone. Missing or unreadable files drop through with
 * a warning — we don't want one broken image to fail the whole export.
 */
export async function inlineImagesAsDataUris(
  html: string,
  sourceDir: string
): Promise<string> {
  const replacements: Array<{ match: string; replacement: string }> = []

  // Collect src values first, then resolve them in parallel.
  const tasks: Array<Promise<void>> = []
  html.replace(IMG_SRC_RX, (match, _quote, src: string) => {
    const task = (async () => {
      const resolved = await resolveImageToDataUri(src, sourceDir)
      if (resolved) {
        const next = match.replace(
          /\bsrc\s*=\s*(["']).*?\1/i,
          `src="${resolved}"`
        )
        replacements.push({ match, replacement: next })
      }
    })()
    tasks.push(task)
    return match
  })

  await Promise.all(tasks)

  let out = html
  for (const { match, replacement } of replacements) {
    out = out.replace(match, replacement)
  }
  return out
}

async function resolveImageToDataUri(
  src: string,
  sourceDir: string
): Promise<string | null> {
  if (!src || DATA_URI_RX.test(src) || REMOTE_URI_RX.test(src)) return null

  let absolutePath: string
  try {
    if (src.startsWith('file://')) {
      absolutePath = fileURLToPath(src)
    } else if (isAbsolute(src)) {
      absolutePath = src
    } else {
      absolutePath = resolvePath(sourceDir, src)
    }
  } catch {
    return null
  }

  try {
    const buf = await fs.readFile(absolutePath)
    const mime = mimeTypeForExt(extname(absolutePath).toLowerCase())
    if (!mime) return null
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch (err) {
    console.warn('[export] could not inline image', absolutePath, err)
    return null
  }
}

function mimeTypeForExt(ext: string): string | null {
  switch (ext) {
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.svg':
      return 'image/svg+xml'
    case '.avif':
      return 'image/avif'
    default:
      return null
  }
}

/* ────────────────────────────── PDF render ────────────────────────── */

const PDF_LOAD_TIMEOUT_MS = 15_000

/**
 * Render a full HTML document to a PDF buffer via an offscreen BrowserWindow.
 * Uses `loadURL(data:text/html;base64,...)` so we don't pollute the filesystem
 * with temp files. `did-finish-load` gates printing; a 15s timeout is a safety
 * valve for malformed HTML that would otherwise hang.
 */
export async function renderHtmlToPdfBuffer(
  fullHtmlDocument: string,
  options: PdfRenderOptions
): Promise<Buffer> {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  try {
    const dataUrl =
      'data:text/html;charset=utf-8;base64,' +
      Buffer.from(fullHtmlDocument, 'utf-8').toString('base64')

    const loaded = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('PDF rendering timed out (did-finish-load never fired)'))
      }, PDF_LOAD_TIMEOUT_MS)

      win.webContents.once('did-finish-load', () => {
        clearTimeout(timer)
        resolve()
      })

      win.webContents.once('did-fail-load', (_event, _code, desc) => {
        clearTimeout(timer)
        reject(new Error(`PDF page failed to load: ${desc}`))
      })
    })

    await win.loadURL(dataUrl)
    await loaded

    const { headerTemplate, footerTemplate } = buildPdfHeaderFooterTemplates(
      options.footerTitle
    )

    const buffer = await win.webContents.printToPDF({
      pageSize: options.pageSize === 'a4' ? 'A4' : 'Letter',
      landscape: options.orientation === 'landscape',
      printBackground: true,
      // Bump bottom margin slightly to leave room for the footer strip.
      margins: {
        top: 0.6,
        bottom: 0.85,
        left: 0.75,
        right: 0.75
      },
      // Render a small page-number footer ("Title • N / M") on every page.
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      // Generate a PDF outline/sidebar from the HTML heading structure — free
      // accessibility + navigation win.
      generateDocumentOutline: true
    })

    return buffer
  } finally {
    if (!win.isDestroyed()) {
      win.destroy()
    }
  }
}

/**
 * Build the HTML templates Electron passes to Chromium's header/footer print
 * slots. These render at a fixed ~10px size and inherit zero styles from the
 * main page, so everything must be inlined. Chromium substitutes the following
 * classes at print time: `.pageNumber`, `.totalPages`, `.title`, `.date`, `.url`.
 *
 * We emit an empty header and a minimal centered footer: `Title • N / M`.
 */
function buildPdfHeaderFooterTemplates(footerTitle?: string): {
  headerTemplate: string
  footerTemplate: string
} {
  const headerTemplate = '<div style="display:none"></div>'

  const titleSpan = footerTitle
    ? `<span style="color:#6b7280">${escapeHtml(footerTitle)}</span> <span style="color:#d4d4d8">•</span> `
    : ''

  const footerTemplate = `
<div style="width:100%;font-size:9px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#6b7280;text-align:center;padding:0 0.75in;">
  ${titleSpan}<span class="pageNumber"></span> / <span class="totalPages"></span>
</div>`.trim()

  return { headerTemplate, footerTemplate }
}

/* ─────────────────────────── dialog helpers ───────────────────────── */

export async function showSaveDialog(
  defaultName: string,
  filters: Electron.FileFilter[]
): Promise<string | null> {
  const focused = BrowserWindow.getFocusedWindow()
  const result = focused
    ? await dialog.showSaveDialog(focused, { defaultPath: defaultName, filters })
    : await dialog.showSaveDialog({ defaultPath: defaultName, filters })
  if (result.canceled || !result.filePath) return null
  return result.filePath
}

/* ───────────────────────────── utils ──────────────────────────────── */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function pathToAssetUrl(filePath: string): string {
  return pathToFileURL(filePath).href
}

/** Ensure a directory exists (recursive mkdir). */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

/** Join + ensureDir convenience used by the course-html writer. */
export async function ensureSubdir(parent: string, ...segments: string[]): Promise<string> {
  const target = join(parent, ...segments)
  await ensureDir(target)
  return target
}

/** Strip characters that are unsafe as file/folder names across platforms. */
export function sanitizeFileName(raw: string): string {
  return raw
    // Intentional control-char range (\x00-\x1f) — filesystems reject these as
    // part of filenames, so we strip them the same way we strip the other
    // reserved punctuation. Lint rule is a false positive here.
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120) || 'untitled'
}

export function dirFor(filePath: string): string {
  return dirname(filePath)
}
