# Changelog

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
