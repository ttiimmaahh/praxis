# Changelog

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
