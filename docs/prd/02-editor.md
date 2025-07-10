# Product Requirement Document: SagasWeave Editor

- **Version:** 0.1
- **Status:** Draft
- **Author:** Trae AI
- **Related PRD:** [01-dashboard.md](./01-dashboard.md)

---

## 1. Introduction

This document specifies the requirements for the SagasWeave Editor, the core component for creating and editing narrative content within the SagasWeave ecosystem. The editor is designed to be a feature-rich, high-performance, and offline-capable tool inspired by the Inky editor, but built with modern web technologies.

## 2. Vision & Goal

The vision is to provide writers with a seamless and powerful narrative design experience. The editor will combine a professional-grade text editor (ACE), a real-time narrative preview (InkJS), an integrated AI assistant, and a robust local file system (WASM-based) into a single, cohesive Progressive Web App (PWA).

The primary goal is to empower users to write, test, and refine their interactive stories from anywhere, on any device, with or without an internet connection.

## 3. Core Components & Features

### 3.1. Editor UI

-   **Layout:** A multi-panel layout, typically split between the code editor, the story preview, and an AI chat panel.
-   **Component:** The editor will be built using the **React-ACE** component.
    -   It must support custom syntax highlighting for the Ink language.
    -   It should handle custom events for interaction with other panels.

### 3.2. Narrative Preview

-   **Compiler/Runtime:** The preview panel will use **InkJS** to compile and run the Ink story directly in the browser.
-   **Real-time Updates:** The preview must update in near real-time as the user types in the editor.
-   **Interactivity:** The user must be able to play through their story in the preview panel, clicking choices and seeing the narrative unfold.

### 3.3. AI Assistant

-   **Component:** An integrated chat panel will provide AI-powered assistance.
-   **Capabilities (as per `contract.json`):
    -   **Narrative Assistance:** Offer suggestions for plot, characters, and dialogue.
    -   **Code/Syntax Help:** Assist with Ink syntax and logic.
    -   **Summarization:** Provide summaries of story branches or character arcs.
-   **Interaction:** The AI should be context-aware, using the content of the active editor file to inform its responses.

### 3.4. Filesystem & Data Persistence

-   **Technology:** A **WASM-based filesystem** (e.g., using `sql.js` to manage file metadata and content in a single SQLite database) will be implemented.
-   **Offline-First:** The entire state of the editor (current file, unsaved changes) must be persisted locally, allowing the user to close and reopen the browser without losing work.
-   **File Operations:** The system will manage all file operations (create, read, update, delete) within this local WASM environment.

## 4. Non-Functional Requirements

-   **PWA (Progressive Web App):** The editor must be installable and fully functional offline.
-   **Performance:** WASM compilation and InkJS previewing must be highly performant to avoid lag during editing.
-   **Modularity:** The editor's components (ACE, InkJS, AI Chat) should be modular and loosely coupled to facilitate maintenance and future upgrades.
-   **Security:** All user-generated content remains on the client-side by default. AI interactions will be routed through a secure backend service running on a Linux VPS.

## 5. Technology Stack

The editor will be built upon the established SagasWeave tech stack:

-   **UI:** React + MUI
-   **Editor Component:** React-ACE
-   **Ink Runtime:** InkJS
-   **Local Filesystem:** SQLite via `sql.js` (WASM)
-   **AI Backend:** Node.js on Linux VPS

## 6. Out of Scope (For MVP)

-   Visual/node-based editing.
-   Direct integration with external asset management systems.
-   Advanced debugging tools (breakpoints, variable inspection) for Ink scripts.

## 7. Test System Definition

-   **Unit Tests (`vitest`):** Test individual functions, such as file handling within the WASM module and AI prompt generation.
-   **Component Tests (`vitest`):** Test React components in isolation (e.g., the AI chat panel, the preview window).
-   **Integration Tests:** Verify that typing in the ACE editor correctly triggers an update in the InkJS preview panel.