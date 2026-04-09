/**
 * IPC-handler implementations for export. Wired up by `registerIpcHandlers`.
 *
 * Each handler receives already-rendered HTML body content from the renderer
 * (via Plate's serializeHtml), inlines images relative to the source file, wraps
 * the result in a full document shell, and either writes it directly (HTML) or
 * pipes it through an offscreen BrowserWindow for printToPDF (PDF).
 */

import { promises as fs } from 'fs'
import { basename, extname, join } from 'path'

import {
  buildExportDocumentShell,
  ensureDir,
  ensureSubdir,
  escapeHtml,
  inlineImagesAsDataUris,
  renderHtmlToPdfBuffer,
  sanitizeFileName,
  showSaveDialog
} from './export-service'

/* ───────────────────── single-document handlers ──────────────────── */

export async function handleExportDocumentHtml(
  payload: DocumentExportPayload
): Promise<string | null> {
  const sourceDir = dirOf(payload.sourceFilePath)
  const inlined = await inlineImagesAsDataUris(payload.bodyHtml, sourceDir)
  const html = buildExportDocumentShell({
    title: payload.documentTitle,
    theme: payload.theme,
    bodyInnerHtml: inlined
  })

  const defaultName = replaceExtension(basename(payload.sourceFilePath), '.html')
  const target = await showSaveDialog(defaultName, [
    { name: 'HTML Document', extensions: ['html'] }
  ])
  if (!target) return null

  await fs.writeFile(target, html, 'utf-8')
  return target
}

export async function handleExportDocumentPdf(
  payload: DocumentPdfExportPayload
): Promise<string | null> {
  const sourceDir = dirOf(payload.sourceFilePath)
  const inlined = await inlineImagesAsDataUris(payload.bodyHtml, sourceDir)
  const html = buildExportDocumentShell({
    title: payload.documentTitle,
    theme: payload.theme,
    bodyInnerHtml: inlined
  })

  const defaultName = replaceExtension(basename(payload.sourceFilePath), '.pdf')
  const target = await showSaveDialog(defaultName, [
    { name: 'PDF Document', extensions: ['pdf'] }
  ])
  if (!target) return null

  const buffer = await renderHtmlToPdfBuffer(html, {
    pageSize: payload.pageSize,
    orientation: payload.orientation,
    footerTitle: payload.documentTitle
  })
  await fs.writeFile(target, buffer)
  return target
}

/* ───────────────────────── course handlers ───────────────────────── */

export async function handleExportCourseHtml(
  payload: CourseExportPayload
): Promise<string | null> {
  const defaultName = sanitizeFileName(payload.courseTitle)
  const target = await showSaveDialog(defaultName, [
    { name: 'Course folder', extensions: [] }
  ])
  if (!target) return null

  // Interpret the returned path as a folder to create. Save dialog gives us a
  // file-style path so strip any extension the user may have typed.
  const folder = stripExtension(target)
  await ensureDir(folder)
  await ensureSubdir(folder, 'assets')
  await ensureSubdir(folder, 'lessons')

  const lessonsByModule = groupByModule(payload.lessons)
  const navHtml = renderCourseNavHtml(lessonsByModule, payload.courseTitle)

  // Inline each lesson's images (resolved relative to the lesson file) and
  // render a per-lesson page that links to ../../../assets/export.css.
  for (let i = 0; i < payload.lessons.length; i++) {
    const lesson = payload.lessons[i]
    const prev = i > 0 ? payload.lessons[i - 1] : null
    const next = i < payload.lessons.length - 1 ? payload.lessons[i + 1] : null

    const inlined = await inlineImagesAsDataUris(
      lesson.bodyHtml,
      dirOf(lesson.lessonFilePath)
    )

    const lessonPage = renderLessonPage({
      theme: payload.theme,
      courseTitle: payload.courseTitle,
      lesson,
      bodyHtml: inlined,
      navHtml,
      prev,
      next
    })

    const lessonDir = await ensureSubdir(folder, 'lessons', lesson.moduleSlug)
    await fs.writeFile(
      join(lessonDir, `${lesson.lessonSlug}.html`),
      lessonPage,
      'utf-8'
    )
  }

  // Write the shared CSS so per-lesson pages can link to it.
  const { EXPORT_CSS } = await import('./export-css')
  await fs.writeFile(join(folder, 'assets', 'export.css'), EXPORT_CSS, 'utf-8')

  // Cover page / TOC at index.html.
  const indexPage = renderIndexPage({
    courseTitle: payload.courseTitle,
    theme: payload.theme,
    lessonsByModule
  })
  await fs.writeFile(join(folder, 'index.html'), indexPage, 'utf-8')

  return folder
}

export async function handleExportCoursePdf(
  payload: CoursePdfExportPayload
): Promise<string | null> {
  const defaultName = `${sanitizeFileName(payload.courseTitle)}.pdf`
  const target = await showSaveDialog(defaultName, [
    { name: 'PDF Document', extensions: ['pdf'] }
  ])
  if (!target) return null

  // Inline images per lesson (their srcs are relative to each lesson's file).
  const processedLessons: Array<LessonExportEntry & { inlinedHtml: string }> = []
  for (const lesson of payload.lessons) {
    const inlinedHtml = await inlineImagesAsDataUris(
      lesson.bodyHtml,
      dirOf(lesson.lessonFilePath)
    )
    processedLessons.push({ ...lesson, inlinedHtml })
  }

  const lessonsByModule = groupByModule(payload.lessons)
  const coverAndToc = renderCoverAndTocForPdf(payload.courseTitle, lessonsByModule)

  // No explicit `<div class="page-break">` between sibling lessons — the print
  // CSS rule `.praxis-lesson { break-before: page }` handles the new-page
  // boundary exactly once. Stacking both caused double page breaks → blank
  // pages between every lesson.
  //
  // We intentionally do NOT inject a manifest-title `<h1>` here. Lesson
  // markdown files own their own title via a leading `# Heading`, and
  // injecting the manifest title on top of that produced a visible duplicate
  // in the exported PDF. The module label above provides the module context
  // that the manifest contributes; the lesson title comes from the body.
  const lessonsHtml = processedLessons
    .map(
      (lesson) => `
<section class="praxis-lesson">
  <p class="module-label" style="color: var(--export-muted); font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.4em;">${escapeHtml(lesson.moduleTitle)}</p>
  ${lesson.inlinedHtml}
</section>`
    )
    .join('\n')

  const fullHtml = buildExportDocumentShell({
    title: payload.courseTitle,
    theme: payload.theme,
    // Cover/TOC → first lesson transition is also driven by the CSS
    // `.praxis-lesson { break-before: page }` rule, no extra page-break div.
    bodyInnerHtml: `${coverAndToc}${lessonsHtml}`
  })

  const buffer = await renderHtmlToPdfBuffer(fullHtml, {
    pageSize: payload.pageSize,
    orientation: payload.orientation,
    footerTitle: payload.courseTitle
  })
  await fs.writeFile(target, buffer)
  return target
}

/* ─────────────────────── renderers (html bits) ───────────────────── */

interface ModuleGroup {
  moduleSlug: string
  moduleTitle: string
  lessons: LessonExportEntry[]
}

function groupByModule(lessons: LessonExportEntry[]): ModuleGroup[] {
  const groups: ModuleGroup[] = []
  const index = new Map<string, ModuleGroup>()
  for (const lesson of lessons) {
    let group = index.get(lesson.moduleSlug)
    if (!group) {
      group = {
        moduleSlug: lesson.moduleSlug,
        moduleTitle: lesson.moduleTitle,
        lessons: []
      }
      index.set(lesson.moduleSlug, group)
      groups.push(group)
    }
    group.lessons.push(lesson)
  }
  return groups
}

function renderCourseNavHtml(groups: ModuleGroup[], courseTitle: string): string {
  const modulesHtml = groups
    .map((group) => {
      const items = group.lessons
        .map(
          (lesson) =>
            `<li><a href="{{LESSON_HREF_PREFIX}}lessons/${escapeHtml(group.moduleSlug)}/${escapeHtml(lesson.lessonSlug)}.html" data-lesson="${escapeHtml(group.moduleSlug)}/${escapeHtml(lesson.lessonSlug)}">${escapeHtml(lesson.lessonTitle)}</a></li>`
        )
        .join('')
      return `<li class="module">${escapeHtml(group.moduleTitle)}<ul>${items}</ul></li>`
    })
    .join('')

  return `
<nav class="praxis-export-nav">
  <h2>${escapeHtml(courseTitle)}</h2>
  <ul>${modulesHtml}</ul>
</nav>`
}

interface LessonPageOptions {
  theme: ExportTheme
  courseTitle: string
  lesson: LessonExportEntry
  bodyHtml: string
  navHtml: string
  prev: LessonExportEntry | null
  next: LessonExportEntry | null
}

function renderLessonPage(options: LessonPageOptions): string {
  const { theme, courseTitle, lesson, bodyHtml, navHtml, prev, next } = options
  const themeClass = theme === 'dark' ? 'praxis-export dark' : 'praxis-export'
  const htmlClass = theme === 'dark' ? 'dark' : ''

  // Lessons live at lessons/<module>/<lesson>.html so refs back to index/assets
  // need two `../`.
  const nav = navHtml.replace(/\{\{LESSON_HREF_PREFIX\}\}/g, '../../')
  const indexHref = '../../index.html'
  const cssHref = '../../assets/export.css'

  const prevHtml = prev
    ? `<a href="../${escapeHtml(prev.moduleSlug)}/${escapeHtml(prev.lessonSlug)}.html">← ${escapeHtml(prev.lessonTitle)}</a>`
    : '<span class="placeholder">·</span>'
  const nextHtml = next
    ? `<a href="../${escapeHtml(next.moduleSlug)}/${escapeHtml(next.lessonSlug)}.html">${escapeHtml(next.lessonTitle)} →</a>`
    : '<span class="placeholder">·</span>'

  return `<!DOCTYPE html>
<html lang="en" class="${htmlClass}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(lesson.lessonTitle)} — ${escapeHtml(courseTitle)}</title>
<link rel="stylesheet" href="${cssHref}">
</head>
<body class="${htmlClass}">
<div class="praxis-export-shell">
  ${nav.replace('<h2>', `<h2><a href="${indexHref}" style="color:inherit;text-decoration:none;">`).replace('</h2>', '</a></h2>')}
  <main class="praxis-export-main">
    <div class="${themeClass}">
      <p style="color: var(--export-muted); font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.25em;">${escapeHtml(lesson.moduleTitle)}</p>
      ${bodyHtml}
      <div class="praxis-export-prevnext">
        ${prevHtml}
        ${nextHtml}
      </div>
    </div>
  </main>
</div>
</body>
</html>`
}

interface IndexPageOptions {
  courseTitle: string
  theme: ExportTheme
  lessonsByModule: ModuleGroup[]
}

function renderIndexPage(options: IndexPageOptions): string {
  const { courseTitle, theme, lessonsByModule } = options
  const themeClass = theme === 'dark' ? 'praxis-export dark' : 'praxis-export'
  const htmlClass = theme === 'dark' ? 'dark' : ''

  const tocHtml = lessonsByModule
    .map((group) => {
      const lessonLinks = group.lessons
        .map(
          (lesson) =>
            `<li><a href="lessons/${escapeHtml(group.moduleSlug)}/${escapeHtml(lesson.lessonSlug)}.html">${escapeHtml(lesson.lessonTitle)}</a></li>`
        )
        .join('')
      return `<li class="module-title">${escapeHtml(group.moduleTitle)}<ol>${lessonLinks}</ol></li>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="en" class="${htmlClass}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(courseTitle)}</title>
<link rel="stylesheet" href="assets/export.css">
</head>
<body class="${htmlClass}">
<div class="${themeClass}">
  <div class="praxis-cover">
    <h1>${escapeHtml(courseTitle)}</h1>
    <p class="subtitle">Course export</p>
  </div>
  <div class="praxis-toc">
    <h2>Contents</h2>
    <ol>${tocHtml}</ol>
  </div>
</div>
</body>
</html>`
}

function renderCoverAndTocForPdf(
  courseTitle: string,
  lessonsByModule: ModuleGroup[]
): string {
  const tocHtml = lessonsByModule
    .map((group) => {
      const items = group.lessons
        .map((lesson) => `<li>${escapeHtml(lesson.lessonTitle)}</li>`)
        .join('')
      return `<li class="module-title">${escapeHtml(group.moduleTitle)}<ol>${items}</ol></li>`
    })
    .join('')

  return `
<div class="praxis-cover">
  <h1>${escapeHtml(courseTitle)}</h1>
  <p class="subtitle">Course export</p>
</div>
<div class="page-break"></div>
<div class="praxis-toc">
  <h2>Contents</h2>
  <ol>${tocHtml}</ol>
</div>`
}

/* ──────────────────────────── helpers ────────────────────────────── */

function dirOf(filePath: string): string {
  const idx = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  return idx >= 0 ? filePath.slice(0, idx) : '.'
}

function replaceExtension(fileName: string, newExt: string): string {
  const ext = extname(fileName)
  if (!ext) return fileName + newExt
  return fileName.slice(0, -ext.length) + newExt
}

function stripExtension(filePath: string): string {
  const ext = extname(filePath)
  if (!ext) return filePath
  return filePath.slice(0, -ext.length)
}
