# Product Requirement Document: SagasWeave Project Dashboard

- **Version:** 0.1
- **Status:** Draft
- **Author:** Trae AI

---

## 1. Introduction

This document outlines the requirements for the SagasWeave Project Dashboard. The dashboard is the primary user interface and entry point for the SagasWeave application. It will provide users with an overview of their narrative projects and serve as a modular platform where new tools and services can be integrated over time.

## 2. Problem Statement

Narrative creators, game writers, and authors lack a unified, offline-first tool that combines writing, version control, and AI-powered assistance. They need a central hub to manage their projects, from initial idea to final version, without being dependent on a constant internet connection or multiple disconnected applications.

## 3. Vision & Goal

The vision is to create a powerful, extensible, and user-friendly Integrated Development Environment (IDE) for narrative content. The initial goal is to build the core of this IDE: a project dashboard.

This dashboard will:
-   Provide a clear overview of all user projects.
-   Act as a launchpad for project-specific tools (e.g., the Ink editor).
-   Be built on a modular architecture that allows for future expansion with new features and services (panels/widgets).

## 4. MVP Features & User Stories

### 4.1. Project Management

-   **As a user, I want to see a list of all my projects** so that I can quickly find and access my work.
    -   Each project in the list should display its name and last modification date.
-   **As a user, I want to create a new project** so that I can start a new story or game.
    -   Creating a project requires a unique project name.
-   **As a user, I want to open an existing project** which will launch the primary tool, the editor view.

### 4.2. Dashboard UI

-   The dashboard will use a panel-based or card-based layout.
-   The initial view will contain one primary panel: "My Projects".
-   The architecture must support adding new panels/widgets in the future (e.g., "AI Assistant Panel", "Version History Panel").

## 5. Non-Functional Requirements

-   **Offline-First:** The application must be fully functional without an internet connection, delivered as a Progressive Web App (PWA).
-   **Performance:** The UI must be fast and responsive, built with React and MUI.
-   **Local Data Persistence:** All project data (metadata and content) will be stored locally in the browser using SQLite compiled to WASM (`sql.js`).
-   **Version Control:** Changes will be periodically and automatically synchronized with a user-configured GitHub repository.
-   **Theming:** The UI must support both light and dark themes, managed via a central CSS stylesheet system.

## 6. Technology Stack

The implementation will adhere to the technology stack defined in the `docs/thought/brainstorm.md` document, including:

-   **Runtime:** Node.js
-   **API Framework:** Express.js
-   **Language:** TypeScript
-   **UI:** React + MUI
-   **Local Database:** SQLite (via `sql.js` WASM)
-   **Backend/Sync:** Linux VPS & GitHub API

## 7. Out of Scope (For MVP)

-   Real-time multi-user collaboration.
-   Advanced project analytics and insights.
-   A public marketplace for sharing projects or templates.
-   Complex user account management beyond GitHub authentication.

## 8. Test System Definition

-   **Unit & Component Testing:** All React components and core logic functions will be tested using `vitest`.
-   **Integration Testing:** Tests will verify the interaction between the UI, the local SQLite database, and the GitHub sync mechanism.
-   **End-to-End (E2E) Testing:** Key user flows will be tested, such as:
    1.  Creating a new project.
    2.  Opening a project and verifying the editor loads.
    3.  Making a change and confirming it's saved locally.