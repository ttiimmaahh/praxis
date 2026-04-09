# Changelog

## v0.2.4 — Document & Course Export

Praxis can now export your work to HTML and PDF — whether it's a single Markdown file or an entire course.

### New

- **Single-document export** — export the active file to a self-contained HTML file (images inlined as data URIs, CSS embedded) or to PDF. Live edits are respected: if you have unsaved changes, the export reflects the editor buffer, not the on-disk version.
- **Course export** — when a `course.yaml` is loaded, export the whole course as:
  - A **multi-page HTML bundle**: `index.html` cover + TOC, one `lessons/<module>/<lesson>.html` per lesson, shared `assets/export.css`, a persistent module/lesson nav sidebar, and prev/next links between adjacent lessons.
  - A **single concatenated PDF**: cover page, table of contents, and every lesson starting on a fresh page with the course title and page numbers in the footer.
- **Export preferences** — new "Export" section in Settings for theme (light / dark), page size (Letter / A4), and orientation (portrait / landscape). Persists across sessions.
- **Sidebar export button** — new `Download` icon in the sidebar header, next to "New course". Dropdown groups entries under **Document** and **Course** sections; Course entries only appear when a course is loaded.
- **Command palette entries** — "Export document as HTML/PDF…" and (when a course is loaded) "Export course as HTML/PDF…" under the File group.
- **Keyboard shortcut** — `⌘⇧X` / `Ctrl+Shift+X` exports the active document as HTML.
- **Learner-mode export** — the current lesson you're reading in learner mode is exportable too: sidebar button, command palette, and keyboard shortcut all treat the learner's current lesson as the active document.
- **Auto-save before course export** — if any files in the course are dirty, they're saved to disk before the export walker runs, so the PDF/HTML reflects your latest edits. A toast confirms what was saved.

### Improved

- **PDF typography** — exported PDFs now use a serif body (Charter / Iowan Old Style / Palatino / Georgia) with sans-serif headings, 11pt/1.55 line-height, orphans/widows protection, `break-inside: avoid` on code blocks, tables, and images, and `break-after: avoid` on headings so they don't strand at page bottoms.
- **PDF page chrome** — footer shows `{Course or Document Title} • {page} / {total}` on every page via Electron's `displayHeaderFooter`. Table headers repeat on every page a table spans.
- **Hyperlink traceability in print** — external links render in body color with the URL shown in small grey after the link text, so paper readers can still see where a link points.

### Fixed

- **YAML frontmatter leaking into exports** — lesson files with `---` frontmatter no longer render the frontmatter block as body text in the PDF/HTML.
- **Code block edit-time chrome in exports** — the language picker, format button, and copy button are now stripped from exported code blocks via a hooks-free `CodeBlockElementStatic` variant, eliminating a React "Invalid hook call" crash that previously broke course export entirely.
- **Blank pages between lessons in course PDF** — removed a double `page-break-before` that stacked an explicit `<div class="page-break">` on top of the CSS `.praxis-lesson { break-before: page }` rule, producing an empty page between every lesson.
- **Duplicate lesson titles in course PDF** — the export pipeline no longer injects the manifest title on top of the markdown's own `# Heading`. The markdown owns its title; the uppercase module label above provides the module context.

### Under the Hood

- New shared `getSharedPlatePlugins({ exportMode, includeDnd })` factory keeps editor and export rendering on the same plugin pipeline, so exports match what users see in the editor.
- Headless Plate rendering via `createPlateEditor` + `PlateStatic` + `renderToStaticMarkup`, statically imported to keep `react-dom/server` in the main bundle. Plate's own `serializeHtml` dynamic-imports the server module, which Vite code-split into a chunk with a second React instance — that's what caused the "Invalid hook call" crash on course export, now resolved by bypassing it.
- `liveMarkdownByPath` slice in `workspace-store` (non-persisted) tracks the editor's live markdown so single-doc export can honor dirty buffers without forcing a save first.
- Main-process export service: image inlining to data URIs, offscreen `BrowserWindow.printToPDF` pipeline with custom header/footer templates and a 15-second timeout safety valve, and a hand-ported `export.css` so exports stay self-contained (no Tailwind runtime).
- Four new IPC handlers: `export:documentHtml`, `export:documentPdf`, `export:courseHtml`, `export:coursePdf`.
- Completes Phase 9 / issue [#18](https://github.com/ttiimmaahh/praxis/issues/18).

### Heads up — auto-update validation

v0.2.4 is the first release that will test the signed → signed auto-update path end-to-end. If you're running v0.2.3 (the signed build), the in-app updater should be able to bridge you to v0.2.4 without a manual DMG download for the first time on macOS.

---

## v0.2.3 — Signed & Notarized macOS Builds

### New

- **macOS code signing** — Praxis is now signed with a Developer ID Application certificate and notarized by Apple. Gatekeeper opens the app cleanly on first launch — no more right-click-Open or `xattr` workaround.
- **macOS auto-update works** — with a stable code-signing identity in place, Squirrel.Mac can now verify updates against the running app's Designated Requirement. v0.2.3 → v0.2.4 and every subsequent release will auto-update on macOS.

### Fixed

- **Silent auto-update failures on macOS** — previous ad-hoc signed builds produced a fresh random identity per build, so Squirrel.Mac refused to install any update. This is resolved for all releases starting with v0.2.3.

### Heads up — one-time manual install required

Because v0.2.2 and earlier were ad-hoc signed, the running app on your machine cannot verify v0.2.3 against its own Designated Requirement — the in-app updater will not be able to bridge this release. **Download the v0.2.3 DMG manually from the [Releases](https://github.com/ttiimmaahh/praxis/releases) page and install over your existing copy.** Every release after v0.2.3 will auto-update normally.

### Under the Hood

- `electron-builder.yml` — enabled `hardenedRuntime`, `notarize: true`, and wired a new `build/entitlements.mac.plist` granting the JIT / unsigned-executable-memory / library-validation exceptions Electron's V8 needs.
- `.github/workflows/release.yml` — pipes `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` into the `electron-builder` step on the macOS runner. Windows and Linux jobs ignore these env vars and continue to ship unsigned as before.

---

## v0.2.2 — Update UX Polish

### New

- **Manual "latest version" confirmation** — clicking "Check for updates" in the Settings menu now shows a toast confirming you're on the latest version when no update is available. Background checks remain silent.
- **Explicit download step** — when an update is available, Praxis no longer starts downloading automatically. The update toast now shows a "Download" button so you control when the bits come down.
- **Error visibility** — update failures now surface in the toast and (for manual checks) a transient error notification, instead of silently disappearing.

### Improved

- **Toast notifications** — added [Sonner](https://sonner.emilkowal.ski/) for transient success/error messages, themed to match the app's dark/light mode.
- **Sticky "ready" state** — once an update is downloaded, a subsequent background check failure no longer clobbers the "Restart to install" toast.
- **Updater diagnostics** — the main process now logs all updater events (`checking`, `available`, `not-available`, `download-progress`, `downloaded`, `error`) to make bug reports easier to triage.
- **README: platform signing status** — documented the current code-signing state for macOS (ad-hoc today, Developer ID planned), Windows (unsigned by design), and Linux, plus what that means for auto-update on each platform.

### Under the Hood

- Removed unused `next-themes` and `lowlight` dependencies
- New `updater:downloadUpdate` IPC handler and preload bridge method; new `updater:not-available` event
- `UpdateNotification` rewritten as a 4-state component (available / downloading / ready / error)

> **Heads up — macOS auto-update is still broken.** macOS Squirrel requires stable code-signing identity to verify updates, and the current ad-hoc signed builds get a fresh identity per build. This release is partly a validation: confirming that even universal-to-universal updates fail without proper Developer ID signing. A follow-up release will add Developer ID Application signing and fix the macOS auto-update pipeline end-to-end.

---

## v0.2.1 — Icon & Universal Mac

### New

- **Application icon** — Praxis now has a proper app icon that shows in the dock, taskbar, and installer. No more default Electron icon.
- **Universal macOS build** — the Mac DMG and ZIP now include both Apple Silicon (arm64) and Intel (x64) slices in a single artifact. Intel Mac users can finally install Praxis natively without Rosetta.

### Under the Hood

- Shared ambient TypeScript types moved from `src/renderer/env.d.ts` into `src/shared/global.d.ts` so the preload and main processes can see them. Resolved 17 latent type errors surfaced by `tsc -p tsconfig.node.json`.
- Fixed a Zod union narrowing bug in `course-manifest.ts` when lessons were specified as bare path strings instead of `{ path, title }` objects.
- Corrected a stale `tsconfig.web.json` reference to `electron-vite/client` (which no longer exists in the installed version) — renderer type-checking now actually runs.
- Wired the new icon into `BrowserWindow` and `app.dock.setIcon()` so it also appears correctly during `npm run dev`.

---

## v0.2.0 — Auto-Update

### New

- **In-app updates** — Praxis now checks for new versions automatically in the background and notifies you when an update is ready. Download happens silently; restart when you're ready.
- **Version display** — the Settings menu now shows the current app version with a manual "Check for updates" button
- **Update notification** — a non-intrusive toast appears in the bottom-left when an update is downloaded, with options to restart now or dismiss for later

### Improved

- **Settings menu** — scrollable on smaller windows so all options remain accessible
- **CI workflow** — simplified release pipeline; electron-builder now publishes artifacts and update manifests directly to GitHub Releases

### Under the Hood

- Added `electron-updater` for cross-platform auto-update support
- Update state managed via dedicated Zustand store
- IPC bridge extended with update event subscriptions following existing patterns
- Local update testing infrastructure with `dev-app-update.yml` and generic provider

---

## v0.1.1 — Source View & Quality of Life

### New

- **Markdown source view** — toggle between the rich editor and raw markdown source with the new Source/Preview button in the editor toolbar. Great for power users who want to see or edit the underlying markdown directly.

### Improved

- **Editor theming** — YAML and markdown source editors now properly match the app's dark and light themes with a new reader-friendly syntax highlighting palette
- **Faster startup** — dialogs and the learner view are now loaded on demand instead of all at once
- **Smarter session saving** — the app no longer writes to disk every 5 seconds when nothing has changed

### Under the Hood

- Added test suite with 40 automated tests
- Added ESLint and Prettier for code quality
- Added CI pipeline that runs lint, tests, and build on every PR
- Replaced manual YAML validation with Zod schemas
- Fixed a memory leak when opening many files in a session
- Removed lodash dependency (replaced with a lightweight utility)

---

## v0.1.0 — Initial Release

The first public release of Praxis, a desktop course authoring and learning platform for technical developer training.

### Editor

- Rich Markdown editing powered by Plate.js
- Tabbed file editing with inline save/close
- YAML editor with syntax highlighting (CodeMirror)
- Word count and reading time in the status bar

### Workspace

- File tree sidebar with create, rename, and delete operations
- Drag-and-drop file and folder reordering
- Full-text workspace search across all Markdown files
- Document outline panel for heading navigation
- Command palette (Cmd/Ctrl+K) for quick actions
- Session persistence — open tabs, sidebar width, and scroll positions restored on relaunch

### Course Authoring

- Define course structure with modules and lessons in `course.yaml`
- Scaffold new courses from built-in or custom templates
- Content schema validation for lesson frontmatter
- Add modules and lessons from the command palette or sidebar
- Course sidebar with structured navigation

### Learner Mode

- Read-only course navigation with progress tracking
- Per-lesson completion tracking persisted locally
- Switch between edit and learner modes from the command palette

### Appearance

- Light and dark themes
- Configurable font family, size, and line height
- macOS native traffic light integration
- Windows/Linux custom title bar overlay with theme sync

### Platform

- macOS (DMG, ZIP), Windows (NSIS installer), Linux (AppImage, DEB)
- Automated multi-platform builds via GitHub Actions
