# SagasWeave Sprints Overview

This document provides a high-level overview of the planned development sprints for the SagasWeave project. Each sprint represents a significant, sequential step towards building the Minimum Viable Product (MVP). The detailed tasks for each sprint are defined in their respective `contract.json` files.

---

### Sprint 1: Core Setup & Dashboard Shell

*   **Goal**: To establish the foundational project structure and create the basic, non-functional shell of the SagasWeave Dashboard.
*   **Method**: Initialize a Bun project with React, TypeScript, and MUI. Set up the PWA manifest, a basic service worker, and a responsive layout with a theme provider for light/dark modes. This sprint lays the technical groundwork for all subsequent development.
*   **Outcome**: A runnable PWA shell that can be installed on a device, featuring a basic fixed `AppBar` and a placeholder content area. The core dependencies and file structure are in place.

### Sprint 2: Dashboard Core Functionality

*   **Goal**: To implement the primary user interactions within the Dashboard, allowing users to manage their projects.
*   **Method**: Develop the UI components for creating, listing, and deleting projects. Implement client-side state management to handle the project list. At this stage, projects are simple data structures stored locally (e.g., in `localStorage` or a simple in-memory store) without a persistent backend.
*   **Outcome**: A functional dashboard where users can create new projects, see them listed in the UI, and remove them. This makes the dashboard a usable, albeit simple, project hub.

### Sprint 3: Editor Foundation & WASM Filesystem

*   **Goal**: To build the fundamental structure of the Editor view and integrate the WASM-based in-browser file system.
*   **Method**: Integrate the ACE Editor component. Set up the initial WASM file system (e.g., using `BrowserFS` with a `MemFS` backend) to manage files and folders virtually within the browser. Implement basic file operations (create, read, write, delete) that interact with the virtual file system.
*   **Outcome**: An editor view where a user can open a project, see a file tree, and edit text files. The file content is persisted within the browser session via the WASM file system.

### Sprint 4: InkJS Integration & Live Preview

*   **Goal**: To enable the core functionality of SagasWeave: writing Ink stories and seeing a live preview.
*   **Method**: Integrate the InkJS compiler as a WASM module or a web worker. Create a preview panel that listens for changes in the ACE editor, sends the content to the InkJS compiler, and renders the playable story output.
*   **Outcome**: A fully interactive development loop where a writer can type Ink syntax in the editor and immediately test the story in the preview pane.

### Sprint 5: AI Assistant Integration

*   **Goal**: To enhance the editor with an AI-powered assistant to help with writing and coding.
*   **Method**: Implement a chat panel UI within the editor. Integrate with a backend service (or a local model if feasible) that provides contextual suggestions, code completion, and narrative brainstorming based on the content of the current file.
*   **Outcome**: An editor with an integrated AI chat that can actively assist the user, improving productivity and creativity.

### Sprint 6: GitHub Integration & Persistence

*   **Goal**: To provide robust, persistent storage and version control for user projects by connecting to GitHub.
*   **Method**: Implement a GitHub API client for OAuth authentication. Develop the logic to synchronize the local WASM file system with a user-specified GitHub repository. This includes pushing local changes to the remote and pulling remote changes to the local environment.
*   **Outcome**: Users can link their SagasWeave projects to a GitHub repository, ensuring their work is saved, versioned, and accessible across different devices.

### Sprint 7: Polishing, Testing & Deployment

*   **Goal**: To prepare the application for a public beta release by ensuring stability, performance, and a polished user experience.
*   **Method**: Conduct end-to-end testing of all features. Perform performance profiling and optimization, especially for the WASM and InkJS components. Refine the UI/UX based on feedback. Prepare documentation and set up a deployment pipeline.
*   **Outcome**: A stable, well-tested, and documented version of the SagasWeave PWA, ready for initial users.