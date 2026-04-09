/**
 * Stand-alone stylesheet for exported HTML/PDF documents.
 *
 * Hand-ported rather than Tailwind-compiled so exports stay self-contained and
 * match print/PDF contexts where the full Tailwind runtime isn't desirable.
 * Scoped under `.praxis-export` (light) or `.praxis-export.dark` so multiple
 * themes can coexist when embedded. Color tokens mirror `src/renderer/styles/globals.css`.
 */
export const EXPORT_CSS = `
/* ── Tokens ─────────────────────────────────────────────────────────── */
:root {
  --export-bg: #ffffff;
  --export-fg: #111111;
  --export-muted: #6b7280;
  --export-border: #e5e7eb;
  --export-code-bg: #f4f4f5;
  --export-code-fg: #111111;
  --export-quote-border: #d4d4d8;
  --export-link: #0a66c2;
  --export-table-border: #e4e4e7;
  --export-table-header-bg: #f4f4f5;
}

.praxis-export.dark {
  --export-bg: #0b0b0c;
  --export-fg: #f5f5f5;
  --export-muted: #a1a1aa;
  --export-border: #2a2a2d;
  --export-code-bg: #18181b;
  --export-code-fg: #f5f5f5;
  --export-quote-border: #3f3f46;
  --export-link: #60a5fa;
  --export-table-border: #27272a;
  --export-table-header-bg: #18181b;
}

/* ── Base layout ────────────────────────────────────────────────────── */
html, body {
  margin: 0;
  padding: 0;
  background: var(--export-bg);
  color: var(--export-fg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.praxis-export {
  max-width: 760px;
  margin: 48px auto;
  padding: 0 24px 64px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu,
    Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  font-size: 16px;
  line-height: 1.65;
  color: var(--export-fg);
  background: var(--export-bg);
}

/* ── Typography ─────────────────────────────────────────────────────── */
.praxis-export h1,
.praxis-export h2,
.praxis-export h3,
.praxis-export h4,
.praxis-export h5,
.praxis-export h6 {
  margin: 1.6em 0 0.6em;
  font-weight: 700;
  line-height: 1.25;
}
.praxis-export h1 { font-size: 2.1em; margin-top: 0; }
.praxis-export h2 { font-size: 1.6em; }
.praxis-export h3 { font-size: 1.3em; }
.praxis-export h4 { font-size: 1.1em; }
.praxis-export h5 { font-size: 1em; }
.praxis-export h6 { font-size: 0.9em; color: var(--export-muted); }

.praxis-export p {
  margin: 0 0 1em;
}

.praxis-export a {
  color: var(--export-link);
  text-decoration: underline;
}

.praxis-export strong { font-weight: 700; }
.praxis-export em { font-style: italic; }
.praxis-export del { text-decoration: line-through; color: var(--export-muted); }

/* ── Lists ──────────────────────────────────────────────────────────── */
.praxis-export ul,
.praxis-export ol {
  margin: 0 0 1em;
  padding-left: 1.6em;
}
.praxis-export li { margin: 0.25em 0; }
.praxis-export li > p { margin: 0.25em 0; }

/* Task list items (GFM) */
.praxis-export ul li input[type="checkbox"] {
  margin-right: 0.5em;
}

/* ── Code ───────────────────────────────────────────────────────────── */
.praxis-export code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
    "Liberation Mono", monospace;
  font-size: 0.9em;
  background: var(--export-code-bg);
  color: var(--export-code-fg);
  padding: 0.15em 0.35em;
  border-radius: 4px;
}

.praxis-export pre {
  background: var(--export-code-bg);
  color: var(--export-code-fg);
  border-radius: 6px;
  padding: 14px 16px;
  overflow-x: auto;
  margin: 0 0 1em;
  font-size: 0.9em;
  line-height: 1.5;
}

.praxis-export pre code {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
}

/* ── Blockquote ─────────────────────────────────────────────────────── */
.praxis-export blockquote {
  margin: 0 0 1em;
  padding: 0.25em 0 0.25em 1em;
  border-left: 3px solid var(--export-quote-border);
  color: var(--export-muted);
}
.praxis-export blockquote > :last-child { margin-bottom: 0; }

/* ── Horizontal rule ────────────────────────────────────────────────── */
.praxis-export hr {
  border: none;
  border-top: 1px solid var(--export-border);
  margin: 2em 0;
}

/* ── Images ─────────────────────────────────────────────────────────── */
.praxis-export img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  display: block;
  margin: 1em auto;
}

/* ── Tables ─────────────────────────────────────────────────────────── */
.praxis-export table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 1em;
  font-size: 0.95em;
}
.praxis-export th,
.praxis-export td {
  border: 1px solid var(--export-table-border);
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}
.praxis-export th {
  background: var(--export-table-header-bg);
  font-weight: 600;
}

/* ── Course-export structure ────────────────────────────────────────── */
.praxis-export .praxis-cover {
  text-align: center;
  padding: 120px 0 80px;
}
.praxis-export .praxis-cover h1 {
  font-size: 2.8em;
  margin-bottom: 0.2em;
}
.praxis-export .praxis-cover .subtitle {
  color: var(--export-muted);
  font-size: 1.1em;
}

.praxis-export .praxis-toc {
  margin: 2em 0 3em;
  padding: 1em 1.25em;
  border: 1px solid var(--export-border);
  border-radius: 6px;
}
.praxis-export .praxis-toc h2 {
  margin-top: 0;
  font-size: 1.2em;
}
.praxis-export .praxis-toc ol {
  padding-left: 1.2em;
}
.praxis-export .praxis-toc .module-title {
  font-weight: 600;
  margin-top: 0.75em;
}

.praxis-export .praxis-lesson {
  padding-top: 1em;
}
.praxis-export .praxis-lesson + .praxis-lesson {
  margin-top: 2em;
  border-top: 1px solid var(--export-border);
}

/* PDF page breaks: used by the course cover/TOC separator. Lesson-to-lesson
   transitions are handled by \`.praxis-lesson { break-before: page }\` in the
   print block, NOT by stacking this div between lessons. */
.page-break {
  page-break-before: always;
  break-before: page;
  height: 0;
}

/* ── Multi-page course HTML bundle (sidebar nav) ────────────────────── */
.praxis-export-shell {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  background: var(--export-bg);
  color: var(--export-fg);
}

.praxis-export-nav {
  border-right: 1px solid var(--export-border);
  padding: 24px 20px;
  background: var(--export-bg);
  position: sticky;
  top: 0;
  max-height: 100vh;
  overflow-y: auto;
}
.praxis-export-nav h2 {
  font-size: 0.95em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--export-muted);
  margin: 0 0 1em;
}
.praxis-export-nav .module {
  font-weight: 600;
  margin-top: 1em;
  color: var(--export-fg);
}
.praxis-export-nav ul {
  list-style: none;
  padding: 0;
  margin: 0.35em 0 0;
}
.praxis-export-nav li {
  margin: 0.15em 0;
}
.praxis-export-nav a {
  color: var(--export-fg);
  text-decoration: none;
  font-size: 0.92em;
  display: block;
  padding: 0.3em 0.5em;
  border-radius: 4px;
}
.praxis-export-nav a:hover {
  background: var(--export-code-bg);
}
.praxis-export-nav a.active {
  background: var(--export-code-bg);
  font-weight: 600;
}

.praxis-export-main {
  min-width: 0;
}

.praxis-export-prevnext {
  display: flex;
  justify-content: space-between;
  gap: 1em;
  margin: 3em 0 0;
  padding-top: 1.5em;
  border-top: 1px solid var(--export-border);
  font-size: 0.92em;
}
.praxis-export-prevnext a {
  color: var(--export-link);
  text-decoration: none;
}
.praxis-export-prevnext .placeholder {
  color: transparent;
  pointer-events: none;
}

/* ── Print tweaks ───────────────────────────────────────────────────── */
/*
 * @page sizing is driven by Electron's printToPDF options (pageSize / landscape
 * + margins), not this block. We only declare margins here so pure-browser
 * print previews have sensible defaults; Electron overrides them at render
 * time via \`preferCSSPageSize: false\`.
 */
@page {
  margin: 0.75in 0.75in 0.9in;
}

@media print {
  html, body {
    background: var(--export-bg);
    color: var(--export-fg);
  }
  .praxis-export {
    margin: 0;
    padding: 0;
    max-width: 100%;
    /* Serif body reads much better in long-form print than sans-serif. */
    font-family: Charter, "Iowan Old Style", "Palatino Linotype", Palatino,
      Georgia, "Times New Roman", serif;
    font-size: 11pt;
    line-height: 1.55;
    /* Avoid lonely first/last lines of paragraphs at page boundaries. */
    orphans: 3;
    widows: 3;
  }
  /* Keep headings sans-serif for a clear visual hierarchy. */
  .praxis-export h1,
  .praxis-export h2,
  .praxis-export h3,
  .praxis-export h4,
  .praxis-export h5,
  .praxis-export h6 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", sans-serif;
    /* Don't leave headings stranded at the bottom of a page. */
    break-after: avoid;
    page-break-after: avoid;
    /* Also keep heading text itself from splitting across pages. */
    break-inside: avoid;
    page-break-inside: avoid;
  }
  /* Tighten heading top margins in print so we don't bleed a heading onto
     its own orphaned page. */
  .praxis-export h1 { margin-top: 0.8em; }
  .praxis-export h2 { margin-top: 1.1em; }
  .praxis-export h3 { margin-top: 0.9em; }
  .praxis-export h4,
  .praxis-export h5,
  .praxis-export h6 { margin-top: 0.8em; }

  /* Hyperlinks: print in body color so they don't look "clickable" on paper;
     show the URL in small grey after the link text for traceability. */
  .praxis-export a {
    color: var(--export-fg);
    text-decoration: underline;
  }
  .praxis-export a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 0.82em;
    color: var(--export-muted);
    word-break: break-all;
  }

  /* Block-level content that should never be split mid-page. */
  .praxis-export pre,
  .praxis-export blockquote,
  .praxis-export table,
  .praxis-export figure,
  .praxis-export img {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .praxis-export pre,
  .praxis-export code {
    page-break-inside: avoid;
  }

  /* Repeat table headers on every page the table spans. */
  .praxis-export thead {
    display: table-header-group;
  }
  .praxis-export tfoot {
    display: table-footer-group;
  }
  .praxis-export tr,
  .praxis-export li {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Course-bundle nav sidebar is screen-only; hide in print. */
  .praxis-export-shell {
    display: block;
  }
  .praxis-export-nav,
  .praxis-export-prevnext {
    display: none;
  }

  /* Course PDF: start every lesson on a fresh page. This is the ONLY
     mechanism for lesson-boundary page breaks — do not also emit
     <div class="page-break"> siblings between lessons, or you'll get
     double-breaks and a blank page between each lesson. */
  .praxis-export .praxis-lesson {
    break-before: page;
    page-break-before: always;
  }
}
`.trim()
