# Markdown Editor PRD

## Problem Statement

Technical writers, developers, and course creators are forced into the wrong trade-offs when working with Markdown.

General-purpose code editors preserve file ownership and Git compatibility but do not feel purpose-built for long-form writing. Premium writing tools like Ulysses feel polished and intentional but compromise on openness, file portability, extensibility, and developer-native workflows.

For curriculum creators the gap is wider. Writing technical courses in Markdown should be natural, versionable, and maintainable, yet most course platforms push authors toward proprietary CMS interfaces or fragmented pipelines that split work across a writing tool, a file system, Git, export scripts, and a separate delivery surface. That fragmentation makes course creation slower, harder to maintain, and less enjoyable than it should be.

For learners, Markdown-based educational content is usually treated as static reference material. There is no polished, integrated experience for reading and progressing through structured Markdown courses.

The unmet need is a single product that combines premium writing UX with the ownership and portability of plain Markdown files, while also unlocking Markdown as a serious format for building and consuming technical curriculum.

## Solution

Build an open-source, cross-platform, local-first Markdown editor that anyone can use to author, edit, and view Markdown files in a polished desktop experience.

On top of that universal editor core, provide first-class support for technical course creation: authors organize curriculum as Git-backed folder trees of Markdown lesson files with a lightweight manifest, and learners read and progress through those courses inside the same application.

The product should feel fast, calm, and beautifully designed. It should rival native premium writing tools on fit and finish while preserving full file ownership, Git compatibility, and extensibility.

Key product decisions:
- **One app, course-aware**: course features are invisible until a course manifest is detected in the open folder.
- **Inline rich preview editing**: Markdown renders as you type in a single pane.
- **Sidebar tree + document outline + command palette**: keyboard-first navigation.
- **Course model**: parent folder, subfolders, Markdown lesson files, single root manifest (e.g. `course.yaml`) with title, ordered modules, ordered lessons.
- **Learner progress**: explicit mark-complete per lesson, visual indicators on the course outline, stored in local app state outside the repository.
- **Built-in Git essentials**: status, diff, commit, push.
- **Templates and content schemas** as the starting point for extensibility.
- **Publishing/export** is important but secondary to authoring and in-app learning.

## User Stories

### General Markdown Editing
1. As a developer, I want to open any folder of Markdown files and start editing immediately, so that I can use this as my primary Markdown tool.
2. As a technical writer, I want inline rich preview that renders Markdown as I type, so that I can see the final result without switching between panes.
3. As a user, I want a sidebar file/folder tree, so that I can navigate large projects quickly.
4. As a user, I want a document outline panel, so that I can jump between headings in long documents.
5. As a user, I want a command palette with keyboard shortcuts for all major actions, so that I can work without reaching for the mouse.
6. As a user, I want the editor to feel fast and responsive even with large files, so that I never wait on the tool.
7. As a user, I want a clean, modern, visually calm interface, so that the tool feels premium and purpose-built for writing.
8. As a user, I want to open, create, rename, move, and delete Markdown files from within the app, so that I do not need to switch to a file manager.
9. As a user, I want full Markdown fidelity, so that the editor never silently alters my source content.
10. As a user, I want configurable themes and typography, so that the writing environment suits my preferences.
11. As a user, I want the app to work on macOS, Windows, and Linux, so that I can use it on any machine.
12. As a user, I want the app to remember my open files and window state between sessions, so that I can resume where I left off.
13. As a user, I want to search across all files in my workspace, so that I can find content quickly.
14. As a user, I want word count and reading time indicators, so that I can track document length.

### Git Integration
15. As a developer, I want to see Git status indicators on files in the sidebar, so that I know which files have uncommitted changes.
16. As a developer, I want to view diffs of my changes from within the app, so that I can review before committing.
17. As a developer, I want to stage and commit changes from within the app, so that I do not need to switch to a terminal.
18. As a developer, I want to push commits to a remote repository from within the app, so that my workflow stays uninterrupted.
19. As a course author, I want to commit and push course updates from the editor, so that my curriculum stays version-controlled without leaving the app.

### Course Authoring
20. As a course author, I want a "New Course" action that scaffolds a folder with a manifest and first module, so that I can start a course quickly without manual setup.
21. As a course author, I want to define my course structure in a single manifest file at the course root, so that the format stays simple and portable.
22. As a course author, I want the manifest to contain the course title, ordered modules, and ordered lessons per module, so that the structure is explicit and versionable.
23. As a course author, I want each lesson to be a single Markdown file, so that content stays granular and easy to maintain.
24. As a course author, I want to reorder modules and lessons by editing the manifest, so that I control the learning sequence.
25. As a course author, I want the app to validate my manifest and warn me about missing or misreferenced files, so that I catch errors before learners see them.
26. As a course author, I want to preview my course as a learner would see it, so that I can verify the reading experience before publishing.
27. As a course author, I want to add new modules and lessons from within the app, so that I can expand a course without leaving the editor.
28. As a course author, I want course features to be invisible when I am editing non-course Markdown, so that the app feels clean and general-purpose by default.

### Learner Experience
29. As a learner, I want to open a course folder and see a structured course outline with modules and lessons, so that I understand the full scope of the material.
30. As a learner, I want to read lessons in a polished, distraction-free reading view, so that the experience feels intentional rather than improvised.
31. As a learner, I want to navigate between lessons using previous/next controls, so that I can move through the course linearly.
32. As a learner, I want to explicitly mark a lesson as complete, so that I can track my own progress.
33. As a learner, I want to see visual progress indicators (checkmarks, progress bar) on the course outline, so that I know how far I have progressed.
34. As a learner, I want my progress to persist between sessions, so that I can pick up where I left off.
35. As a learner, I want my progress stored locally and outside the course repository, so that the authored content stays clean.
36. As a learner, I want to jump to any lesson in the outline, so that I can skip ahead or revisit earlier material.

### Templates and Extensibility
37. As a course author, I want starter templates for common course structures, so that I do not have to design a folder layout from scratch.
38. As a course author, I want content schemas that define expected frontmatter or metadata for lessons, so that I can maintain consistency across a course.
39. As a user, I want the template and schema system to be file-based and portable, so that I can share templates with others via Git.

### Export
40. As a course author, I want to export my course content for use outside the app, so that I am not locked into a single delivery surface.
41. As a technical writer, I want to export Markdown to common formats (HTML, PDF), so that I can share polished output with non-technical readers.

## Implementation Decisions

### Major Modules

1. **Editor Core** -- Inline rich-preview Markdown editing engine. Handles rendering, text input, cursor management, Markdown parsing, and fidelity guarantees. Deep module: complex internals behind a simple "edit a Markdown document" interface.

2. **Document Manager** -- File and folder operations: open, save, create, rename, move, delete. Workspace state persistence. Abstracts the local file system behind a clean API.

3. **Navigation Shell** -- Sidebar file/folder tree, document outline panel, command palette, keyboard shortcut registry. Composes UI panels into the main application layout.

4. **Course Engine** -- Manifest parsing and validation, course detection (presence of manifest file), scaffold action ("New Course"), module/lesson ordering logic. Deep module: encapsulates all course-structure logic behind a simple interface that answers "is this a course, and what is its structure?"

5. **Learner View** -- In-app reader for course content. Course outline with progress indicators, previous/next navigation, explicit mark-complete interaction. Consumes Course Engine for structure and Progress Store for state.

6. **Progress Store** -- Local persistence of learner progress per course. Stores completion state per lesson, keyed by course identity. Deep module: simple read/write interface, all persistence logic encapsulated.

7. **Git Integration** -- Status, diff, commit, push operations exposed through the app UI. Wraps Git CLI or library behind an interface that the Navigation Shell and Document Manager can consume.

8. **Template & Schema System** -- Course starter templates, content schemas for lesson frontmatter, scaffold generation logic. File-based and portable.

9. **Export Pipeline** -- Markdown-to-output rendering (HTML, PDF). Secondary priority. Consumes Editor Core's parser.

10. **App Shell** -- Cross-platform desktop wrapper (e.g. Electron or Tauri), window management, theming, settings, session restore.

### Architectural Decisions

- The app is one product with course-aware behavior, not two separate modes.
- Course features activate only when a manifest file is detected.
- The manifest is a single file at the course root (e.g. `course.yaml`) containing title, ordered modules, and ordered lessons per module.
- The smallest learner unit is a single Markdown lesson file.
- Learner progress is stored in local app state, never inside the course repository.
- Git integration covers essentials (status, diff, commit, push) but not full branch/merge/PR workflows.
- Extensibility starts with templates and content schemas, not a plugin API.
- Publishing/export is supported but secondary to authoring and in-app learning.

## Testing Decisions

Tests should verify external behavior through module interfaces, not implementation details. A good test exercises the public contract of a module and asserts observable outcomes.

### Modules requiring tests

- **Editor Core**: verify Markdown parsing fidelity, inline rendering correctness, and round-trip integrity (source in, source out without silent mutation). Test through the editing interface, not internal parser state.
- **Course Engine**: verify manifest parsing, validation (missing files, malformed structure), course detection, scaffold output, and ordering logic. Test through the course-structure query interface.
- **Progress Store**: verify read/write/persistence of completion state, isolation between courses, and resilience to missing or corrupted state files. Test through the progress read/write interface.
- **Git Integration**: verify that status, diff, commit, and push operations produce correct results against a real or simulated Git repository. Test through the Git operation interface.

No prior test art exists in the codebase (empty repo).

## Out of Scope

- Real-time multiplayer collaboration
- Cloud-first storage or mandatory hosted accounts
- Full LMS features: grading, cohort management, certification, enterprise administration
- Course marketplace or monetization system
- Non-Markdown content authoring as a primary goal
- Advanced Git workflows: branching, merge conflict resolution, pull requests
- A plugin API or extension marketplace
- Mobile or tablet applications
- AI-assisted writing or content generation features

## Further Notes

- The emotional promise of the product is **clarity and confidence**. Every UX decision should reinforce that feeling.
- The reason a user switches to this product is **one unified workspace** for writing, course structuring, Git-backed ownership, and learner viewing.
- The open-source promise means **ownership, portability, transparency, and extensibility**. Sustainability model is intentionally open but must never compromise local-first file ownership.
- The product should be marketed as a great Markdown editor first. Course features are the strategic differentiator but should not narrow the perceived audience before users see the broader value.
- The concept document at `markdown-editor-concept.md` in this repo captures the original vision and can serve as a companion to this PRD.
