# Plan: Markdown Editor

> Source PRD: plans/prd.md

## Architectural decisions

Durable decisions that apply across all phases:

- **App runtime**: Cross-platform desktop application (Electron or Tauri). Single window with panel-based layout.
- **Editing model**: Single-pane inline rich preview. Markdown renders as the user types. Source fidelity is guaranteed (round-trip safe, no silent mutations).
- **File model**: Plain Markdown files on disk. No proprietary format. No content database. The file system is the source of truth.
- **Course manifest**: A single `course.yaml` file at the course root. Contains course title, ordered list of modules, and ordered list of lessons per module. Everything else is optional.
- **Learner progress storage**: Local app state stored in the application's user data directory (e.g. JSON or SQLite). Never written inside the course repository.
- **Git integration**: Wraps Git CLI or a Git library behind an internal interface. Exposes status, diff, commit, and push. Does not expose branching, merging, or PR workflows.
- **Navigation model**: Sidebar file/folder tree, document outline panel, and command palette. All major actions reachable via keyboard shortcuts.
- **Extensibility model**: File-based templates and content schemas. No plugin API in the initial product.

---

## Phase 1: App Shell and File Tree

**User stories**: 1, 3, 8, 11, 12

### What to build

A cross-platform desktop application that opens a folder from disk and displays its contents in a sidebar file/folder tree. The user can open Markdown files into a basic editor pane (plain text is acceptable at this stage). File operations (create, rename, move, delete) work from the sidebar. Window position, size, and open files persist between sessions. This phase proves the desktop runtime, the file system integration, and the core application layout.

### Acceptance criteria

- [ ] The app launches on macOS, Windows, and Linux
- [ ] The user can open a folder and see its file/folder tree in a sidebar
- [ ] Clicking a Markdown file opens it in the main editor pane
- [ ] The user can create, rename, move, and delete files and folders from the sidebar
- [ ] Window state (position, size, open files, active file) persists across app restarts

---

## Phase 2: Inline Rich Preview Editor

**User stories**: 2, 6, 7, 9

### What to build

Replace the plain text editor pane with an inline rich preview Markdown editor. Markdown syntax renders visually as the user types in a single pane (headings, bold, italic, links, code blocks, lists, images, tables). The source Markdown is never silently altered; saving and reopening a file produces identical content. The editor remains fast and responsive with files of at least several thousand lines. The visual design should be clean and calm, establishing the baseline aesthetic of the product.

### Acceptance criteria

- [ ] Markdown renders inline as the user types (headings, emphasis, links, code, lists, images, tables)
- [ ] Saving a file and reopening it produces byte-identical Markdown source
- [ ] The editor remains responsive with files of 5,000+ lines
- [ ] The editor pane has a clean, modern visual design with appropriate typography and spacing

---

## Phase 3: Navigation and Keyboard System

**User stories**: 4, 5, 13, 14

### What to build

Add a document outline panel that lists headings in the current file and allows jumping to any heading. Implement a command palette that surfaces all major actions and is opened via a keyboard shortcut. Register keyboard shortcuts for common operations (open file, save, close, search, toggle sidebar, toggle outline). Add workspace-wide full-text search across all Markdown files in the open folder. Display word count and estimated reading time for the active document.

### Acceptance criteria

- [x] A document outline panel lists all headings in the active file; clicking a heading scrolls to it
- [x] A command palette opens via keyboard shortcut and lists all registered actions
- [x] Keyboard shortcuts exist for open, save, close, search, toggle sidebar, and toggle outline
- [x] Workspace-wide search finds text across all Markdown files and navigates to results
- [x] Word count and reading time are displayed for the active document

### Phase 3 implementation log

1. **Document outline (headings + jump)** — **Done.** Added `DocumentOutline` beside the editor, ATX heading extraction from live markdown, and `MarkdownEditor` imperative scroll via ProseMirror heading positions (`scrollToHeadingIndex`).

2. **Command palette** — **Done.** Integrated `cmdk` (`components/ui/command.tsx`) with `CommandPalette` dialog listing file, workspace, and view actions; wired to store and window events for save/close/sidebar.

3. **Keyboard shortcuts** — **Done.** `KeyboardNavigationLayer` registers Ctrl/Cmd+O (open folder), Ctrl/Cmd+Shift+P (palette), Ctrl/Cmd+Shift+F (workspace search), Ctrl/Cmd+Shift+O (toggle outline), Ctrl/Cmd+B (toggle sidebar when not in a contenteditable field to avoid clashing with bold). EditorArea keeps Ctrl/Cmd+S and Ctrl/Cmd+W for save and close tab.

4. **Workspace-wide Markdown search** — **Done.** Main-process `searchWorkspaceMarkdown` walks the open folder for `.md` files, matches lines (case-insensitive), exposes `fs:searchWorkspace` IPC; `WorkspaceSearchDialog` lists results and opens the selected file.

5. **Word count + reading time** — **Done.** `word-stats.ts` counts words from live markdown; status strip under the tab bar shows word count and estimated minutes (~200 wpm) whenever the document has at least one word.

---

## Phase 4: Theming and Visual Polish

**User stories**: 7, 10

### What to build

Implement a theming system with at least a light theme and a dark theme. Allow the user to configure typography (font family, font size, line height). Apply visual polish across the entire application: consistent spacing, transitions, focus states, scroll behavior, and attention to detail that makes the product feel premium. This phase is the fit-and-finish pass.

### Acceptance criteria

- [x] The user can switch between light and dark themes
- [x] The user can configure font family, font size, and line height
- [x] Theme preference persists between sessions
- [x] Visual polish is applied consistently across sidebar, editor, outline, command palette, and all dialogs
- [x] The overall experience feels noticeably more refined than a generic code editor

### Phase 4 implementation log

1. **Theming (light / dark / system)** — **Done.** `appearance-store` + `applyAppearanceToDocument` toggle the `dark` class on `document.documentElement`; system mode follows `prefers-color-scheme` with `useAppearanceSystemListener`. Palette icon + popover in the title bar; command palette entry opens the same menu.

2. **Typography** — **Done.** Presets: sans (system), serif, monospace; editor font size 13–22px and line height 1.35–2.0 via sliders. CSS variables `--editor-font-*` and `--editor-scale` wire Crepe (`--crepe-font-default` / title); shell uses `--app-font-family` on `html`/`body`. Crepe’s theme ships fixed `px` on `.ProseMirror` blocks, so `globals.css` applies scaled sizes and line-height with overrides after those rules.

3. **Persistence** — **Done.** `themeMode`, `editorFontPreset`, `editorFontSizePx`, and `editorLineHeight` are stored in `session.json` via extended `SessionData`; `getSession` / `saveSession` merge with defaults so older session files stay valid.

4. **Polish** — **Done.** Short color transitions on `html`, shared popover styling, title bar layout with truncated folder name + appearance control, command palette integration, focus rings on native controls in the appearance menu.

---

## Phase 5: Git Essentials

**User stories**: 15, 16, 17, 18, 19

### What to build

Detect whether the open folder is a Git repository. If it is, show Git status indicators (modified, added, untracked) on files in the sidebar tree. Provide an in-app diff view that shows changes for a selected file. Allow the user to stage files, write a commit message, and commit from within the app. Allow the user to push commits to the configured remote. All Git operations go through an internal interface that wraps the Git CLI or library.

### Acceptance criteria

- [ ] The sidebar shows Git status indicators on modified, added, and untracked files
- [ ] The user can view a diff of changes for any modified file
- [ ] The user can stage files, enter a commit message, and commit from the app
- [ ] The user can push commits to the remote repository from the app
- [ ] Git operations surface clear error messages on failure (no remote configured, auth failure, etc.)

---

## Phase 6: Course Engine and Scaffold

**User stories**: 20, 21, 22, 23, 24, 25, 27, 28

### What to build

Implement the Course Engine module. When the user opens a folder containing a `course.yaml` manifest, the app detects it as a course and activates course-aware UI. The manifest is parsed to extract the course title, ordered modules, and ordered lessons per module. The app validates the manifest against the actual folder contents and warns about missing or misreferenced files. A "New Course" action scaffolds a new folder with a manifest and a first module containing a first lesson. The user can add new modules and lessons from the course-aware UI. When no manifest is present, all course features remain invisible.

### Acceptance criteria

- [x] Opening a folder with a valid `course.yaml` activates course-aware UI
- [x] The course title, modules, and lessons are displayed according to the manifest ordering
- [x] Validation warns about lessons referenced in the manifest but missing on disk
- [x] The "New Course" action creates a folder with a `course.yaml`, a first module folder, and a first lesson file
- [x] The user can add new modules and lessons from the course UI
- [x] Course features are completely invisible when no manifest is present

### Phase 6 implementation log

1. **Course manifest (detection, parse, validate, UI)** — **Done.** Shared `course.yaml` schema and `validateCourseManifestStructure` in `src/shared/course-manifest.ts`; main `loadCourseManifest` reads root `course.yaml`, parses YAML, validates shape, checks module folders and lesson files on disk, returns warnings. IPC `course:loadManifest`; `course-store` + `useCourseManifestSync` reload on root change and file watcher events. Sidebar `CoursePanel` (shadcn `Alert` + `Collapsible`) shows invalid manifest errors, optional warnings, and ordered modules/lessons that open files in the workspace. No course UI when the file is absent. Lessons may be a filename string or `{ path, title }` for sidebar labels.

2. **Course author sidebar** — **Done.** When a valid manifest is loaded (`course` status `ready`), the full file tree moves under a collapsible **Project files** section (default collapsed; state persisted as `courseProjectFilesExpanded` in session). Non-course workspaces and invalid manifests keep the full-height file tree. Command palette **Toggle project files** and **⌘⇧E** / **Ctrl+Shift+E** toggle the section when a course is active.

3. **Course scaffold & authoring** — **Done.** Main-process `course-authoring.ts` writes validated `course.yaml` via `yaml` stringify + `validateCourseManifestStructure`. IPC: `course:createNewCourseFolder` (dialog with `createDirectory`, scaffold `01-module` + `lesson-01.md`, `startWatching`), `course:scaffold` for “Start course in this folder” when no manifest, `course:addModule` / `course:addLesson` append to `course.yaml` and create files. Sidebar header **BookPlus** opens new course; `no-manifest` workspace shows **Start course in this folder**; course outline **+** adds module (next `NN-module`) or lesson per module (`lesson-NN.md`). Command palette lists the same actions. Renderer calls `loadForRoot` after mutations so the sidebar updates (with existing file-watcher reload).

---

## Phase 7: Learner View and Progress

**User stories**: 26, 29, 30, 31, 32, 33, 34, 35, 36

### What to build

Add a learner-facing reading view for course content. When a course is detected, the user can switch to a learner view that presents the course outline with modules and lessons, and renders each lesson in a polished, distraction-free reading layout. Previous/next controls allow linear navigation through the course. The user can explicitly mark a lesson as complete. The course outline shows visual progress indicators (checkmarks per lesson, progress bar per module). Progress is persisted in local app state outside the course repository. The course author can preview the course as a learner would see it.

### Acceptance criteria

- [ ] A learner view presents the course outline with modules and ordered lessons
- [ ] Lessons render in a distraction-free reading layout
- [ ] Previous/next controls navigate linearly through lessons
- [ ] The user can mark a lesson as complete; a checkmark appears on the outline
- [ ] Each module shows a progress bar reflecting completed lessons
- [ ] Progress persists between sessions
- [ ] Progress is stored outside the course repository (in the app's local data directory)
- [ ] The user can jump to any lesson from the outline

---

## Phase 8: Templates and Content Schemas

**User stories**: 37, 38, 39

### What to build

Provide starter templates for common course structures (e.g. a multi-module tutorial, a single-module workshop, a reference guide). When the user creates a new course, they can choose from available templates. Implement content schemas that define expected frontmatter fields for lesson files (e.g. title, description, duration). The app validates lesson files against the active schema and surfaces warnings for missing or unexpected fields. Templates and schemas are file-based and can be shared via Git.

### Acceptance criteria

- [ ] At least two starter templates are available when creating a new course
- [ ] Templates scaffold the correct folder structure, manifest, and lesson files
- [ ] Content schemas define expected frontmatter fields for lesson files
- [ ] The app warns when a lesson file is missing required frontmatter fields
- [ ] Templates and schemas are stored as files that can be committed and shared via Git

---

## Phase 9: Export Pipeline

**User stories**: 40, 41

### What to build

Add an export pipeline that renders Markdown content to HTML and PDF. For individual documents, the user can export the active file. For courses, the user can export the entire course as a collection of HTML pages or a single PDF. The export uses the same Markdown parser as the editor to ensure visual consistency. This phase is secondary priority and intentionally kept narrow.

### Acceptance criteria

- [ ] The user can export the active Markdown file to HTML
- [ ] The user can export the active Markdown file to PDF
- [ ] The user can export an entire course to HTML (one page per lesson, with navigation)
- [ ] The user can export an entire course to a single PDF
- [ ] Exported output is visually consistent with the in-app rendering

---

## Cleanup phase (deferred polish)

Work deferred from earlier phases or discovered during implementation. Tackle after core feature phases (or incrementally alongside them).

### Phase 2 editor — follow-ups

- **Round-trip fidelity**: Document and test how closely saved Markdown matches disk after open/close (Milkdown + remark may normalize whitespace, list markers, or other stylistic details). Decide product stance: byte-identical for externally edited files vs. “stable for content authored in-app.”
- **Large-document performance**: Smoke-test or benchmark the editor with **5,000+ line** files (scroll, type, undo) on macOS, Windows, and Linux.
- **Editing shortcuts**: Verify **undo, redo, cut, copy, paste, select all** (and platform conventions) on all three platforms with the Milkdown/ProseMirror stack.
- **Window chrome (macOS)**: Investigate **thin edge/hairline** around the window (transparent/opaque + vibrancy vs. solid `backgroundColor`); try renderer masks, Electron options, or documented workarounds; re-evaluate if **vibrancy** should return once the line is gone.
- **Typography / spacing**: Crepe + Luma variables are baseline; optional pass to align Milkdown blocks with the rest of the shell (Phase 4 may subsume some of this).

### Global CSS / shell

- Revisit universal `*` base styles (`border-border`, etc.) if any Electron/Chromium edge artifacts persist after window fixes.
