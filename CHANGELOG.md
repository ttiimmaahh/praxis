# Changelog

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
