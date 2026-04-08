/**
 * Built-in course template YAML strings, seeded into the templates directory
 * on first launch when no templates exist yet.
 */

export const BUILT_IN_TEMPLATES: Record<string, string> = {
  'multi-module': `name: Multi-Module Tutorial
description: A structured course with multiple modules, ideal for step-by-step tutorials
schema:
  lessonFields:
    - name: title
      required: true
      type: string
    - name: description
      required: false
      type: string
    - name: duration
      required: false
      type: string
modules:
  - folder: 01-getting-started
    title: Getting Started
    lessons:
      - file: welcome.md
        title: Welcome
        body: |
          ---
          title: Welcome
          description: ""
          duration: ""
          ---

          # Welcome

          Start writing your lesson here.
      - file: setup.md
        title: Setup
        body: |
          ---
          title: Setup
          description: ""
          duration: ""
          ---

          # Setup

          Describe the setup steps here.
  - folder: 02-core-concepts
    title: Core Concepts
    lessons:
      - file: fundamentals.md
        title: Fundamentals
        body: |
          ---
          title: Fundamentals
          description: ""
          duration: ""
          ---

          # Fundamentals

          Explain the core concepts here.
      - file: deep-dive.md
        title: Deep Dive
        body: |
          ---
          title: Deep Dive
          description: ""
          duration: ""
          ---

          # Deep Dive

          Go deeper into the topic here.
  - folder: 03-next-steps
    title: Next Steps
    lessons:
      - file: advanced-topics.md
        title: Advanced Topics
        body: |
          ---
          title: Advanced Topics
          description: ""
          duration: ""
          ---

          # Advanced Topics

          Cover advanced material here.
      - file: wrap-up.md
        title: Wrap Up
        body: |
          ---
          title: Wrap Up
          description: ""
          duration: ""
          ---

          # Wrap Up

          Summarize the course and suggest next steps.
`,

  workshop: `name: Single-Module Workshop
description: A focused single-module workshop with intro, exercise, and wrap-up
schema:
  lessonFields:
    - name: title
      required: true
      type: string
    - name: description
      required: false
      type: string
modules:
  - folder: workshop
    title: Workshop
    lessons:
      - file: introduction.md
        title: Introduction
        body: |
          ---
          title: Introduction
          description: ""
          ---

          # Introduction

          Introduce the workshop topic and objectives.
      - file: exercise.md
        title: Exercise
        body: |
          ---
          title: Exercise
          description: ""
          ---

          # Exercise

          Describe the hands-on exercise here.
      - file: wrap-up.md
        title: Wrap Up
        body: |
          ---
          title: Wrap Up
          description: ""
          ---

          # Wrap Up

          Summarize key takeaways and next steps.
`,

  blank: `name: Blank
description: A minimal starter with one module and one lesson — full control over structure
modules:
  - folder: 01-module
    title: Module 1
    lessons:
      - file: lesson-01.md
        title: Lesson 1
        body: |
          # Lesson 1: New lesson

          Start writing your lesson here.
`
}

/** The IDs of built-in templates, in display order */
export const BUILT_IN_TEMPLATE_IDS = ['multi-module', 'workshop', 'blank']
